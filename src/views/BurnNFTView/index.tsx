import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { Loader, SolanaLogo } from "components";
import styles from "./index.module.css";
import { Metaplex, toBigNumber } from "@metaplex-foundation/js";
import { PublicKey, Transaction, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  createBurnEditionNftInstruction,
  createBurnNftInstruction,
  PROGRAM_ADDRESS,
  PROGRAM_ID,
  createBurnInstruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { BN, utils } from "@project-serum/anchor";

//webhook
import axios from 'axios';


const checkApi = async () => {
  try {
    const response = await axios.get('https://orbit-server-green.vercel.app/burned');
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};


const postData = async (address: string, signature: string, orbits: string, number: Number) => {
  try {
    const response = await axios.post('https://orbit-server-green.vercel.app/data', {
      address,
      signature,
      orbits,
      number,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    sendMessage(address,signature,orbits,number);
    console.log("Bugged in here");
    console.error(error);
    return null;
  }
};

const sendMessage = async (address: string, signature: string, orbits: string, number: Number) => {
  const url = 'https://discord.com/api/webhooks/1092026992267902986/tVLiu4RsiRb2jIaESpkioD_5WB88RdfV1-IyDOW6muCIOAsD4p5WIKzxjavY0eS9NF72';

  const data = {
    embeds: [
      {
        title: 'Orbits Missing Burns',
        description: 'Please Add this tx to the database',
        color: 16711680, // red color
        fields: [
          {
            name: 'address',
            value: address,
          },
          {
            name: 'signature',
            value: signature,
          },
          {
            name: 'orbits',
            value: orbits,
          },
          {
            name: number,
            value: number,
          },
        ],
      },
    ],
  };

  try {
    await axios.post(url, data);
  } catch (error) {
    console.error(error);
  }
};

export const BurnNFTView: FC = ({}) => {
  const { connection } = useConnection();

  const wallet = useWallet();
  const metaplex = new Metaplex(connection);
  const [userNFT, setUserNFT] = useState<any | null>(null);
  const [orbs, setOrbs] = useState<any | null>(null);
  const [isFetched, setIsFetched] = useState<boolean>(false);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [currentTx, setCurrentTx] = useState<number | null>(null);
  const [totalTx, setTotalTx] = useState<number | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [toBurn, setToBurn] = useState<any>([]);

  async function getUserNFT() {
    if (!wallet.publicKey) {
      setUserNFT([]);
      return;
    }
    const publickey = wallet.publicKey;
    setIsFetched(false);

    const userNFTs = await metaplex
      .nfts()
      .findAllByOwner({ owner: wallet.publicKey });

    const orbs = await connection.getParsedTokenAccountsByOwner(
      publickey,
      {
        programId: new PublicKey(
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        ),
        mint: new PublicKey("3TMxuBEMAV3BQunMBrFtKf8UQT2LmJchVbnV2o2ddkZU")
      },
      "processed"
    );

    console.log(userNFTs);
    console.log(orbs.value);

    const seed1 = Buffer.from(utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(PROGRAM_ID.toBytes());
    const seed4 = Buffer.from(utils.bytes.utf8.encode("edition"));

    const userNFTMetadata = await Promise.all(
      userNFTs.map(async (token) => {
        // @ts-ignore
        const mintPublickey = token.mintAddress;
        const mint = mintPublickey.toBase58();
        let name = token.name.trim();
        let logoURI: string;
        const collectionAddress = token.collection?.address;
        const creator = token.creators[0]?.address.toBase58();
        let collectionMetadata: string | undefined = undefined;
        if (collectionAddress) {
          const [collectionMetadataPDA, _bump3] =
            PublicKey.findProgramAddressSync(
              [seed1, seed2, Buffer.from(collectionAddress.toBytes())],
              PROGRAM_ID
            );
          collectionMetadata = collectionMetadataPDA.toBase58();
        }
        const seed3 = Buffer.from(mintPublickey.toBytes());
        const [_masterEditionPDA, _bump2] = PublicKey.findProgramAddressSync(
          [seed1, seed2, seed3, seed4],
          PROGRAM_ID
        );
        const masterEditionPDA = _masterEditionPDA.toBase58();
        const metadataAccount = token.address.toBase58();
        const NFTloaded = await metaplex
          .nfts()
          .findByMint({ mintAddress: mintPublickey });

        if (name == "" && NFTloaded.json?.name && NFTloaded.json?.name != "") {
          name = NFTloaded.json?.name.trim();
        }
        if (NFTloaded.json?.image && NFTloaded.json?.image != "") {
          logoURI = NFTloaded.json?.image;
        } else {
          logoURI =
            "https://zfrozvqos4wvbc54gejmcgjmkrhoinaodm63hjkwzgsbzfkwpaaa.arweave.net/yWLs1g6XLVCLvDESwRksVE7kNA4bPbOlVsmkHJVWeAA";
        }
        
        // @ts-ignore
        const isMasterEdition = NFTloaded?.edition?.isOriginal;
        // const edition = NFTloaded.
        const tokenAccount = (
          await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mintPublickey,
            publickey
          )
        ).toBase58();

        return {
          name,
          logoURI,
          metadataAccount,
          mint,
          tokenAccount,
          masterEditionPDA,
          collectionMetadata,
          isMasterEdition,
          creator, 
          collectionAddress
        };
      })
    );
    userNFTMetadata.sort(function (a, b) {
      if (a.name.toUpperCase() < b.name.toUpperCase()) {
        return -1;
      }
      if (a.name.toUpperCase() > b.name.toUpperCase()) {
        return 1;
      }
      return 0;
    });

    const filter_orbits = userNFTMetadata.filter((token) => {
      return token?.collectionAddress?.toBase58() == "3NDa4uYf1He6ZEkXifQtrTxUAXnwGc82Bmb4irdqSAZt";
    });
    
    setUserNFT(filter_orbits);
    setOrbs(orbs);
    setIsFetched(true);
    console.log("user NFTs", filter_orbits);
  }

  useEffect(() => {
    getUserNFT();
  }, [wallet.publicKey]);

  const BurnTokens = async () => {
    const publickey = wallet.publicKey;
    try {
      if (toBurn[0] != undefined && publickey && toBurn.length %2 == 0 && orbs.value.length > 0) {

        const api = await checkApi();
        if(api){
        //orbs
        const tokenAccountaddress = orbs.value[0].pubkey.toBase58();
        const orbs_amount = orbs.value[0].account.data.parsed.info.tokenAmount.amount;
        console.log(orbs_amount);
        if(orbs_amount / 1000000000 >= toBurn.length * 447){
        let total_amount = 0;

        setIsBurning(true);
        setSuccess(false);
        setMessage("");
        const nbPerTx = 4;
        let nbTx: number;
        if (toBurn.length % nbPerTx == 0) {
          nbTx = toBurn.length / nbPerTx;
        } else {
          nbTx = Math.floor(toBurn.length / nbPerTx) + 1;
        }
        setTotalTx(nbTx);

        for (let i = 0; i < nbTx; i++) {
          let orbits = ""
          setCurrentTx(i + 1);
          let Tx = new Transaction();

          let bornSup: number;

          if (i == nbTx - 1) {
            bornSup = toBurn.length;
          } else {
            bornSup = nbPerTx * (i + 1);
          }

          const seed1 = Buffer.from(utils.bytes.utf8.encode("metadata"));
          const seed2 = Buffer.from(PROGRAM_ID.toBytes());
          const seed4 = Buffer.from(utils.bytes.utf8.encode("edition"));

          for (let j = nbPerTx * i; j < bornSup; j++) {
            const tokenAccount = new PublicKey(toBurn[j].tokenAccount);
            const mint = new PublicKey(toBurn[j].mint);
            const masterEditionPDA = new PublicKey(toBurn[j].masterEditionPDA);
            const metadataAccount = new PublicKey(toBurn[j].metadataAccount);
            const collectionMetadata = toBurn[j].collectionMetadata;
            const isMasterEdition = toBurn[j].isMasterEdition;
            orbits = orbits + " " + toBurn[j].name;
            let burnAccount;
            const tokenRecord = metaplex.nfts().pdas().tokenRecord({ mint: mint, token: tokenAccount});
            total_amount = total_amount + 447;

            if (isMasterEdition == true){

              const tokenRecordInfo = await connection.getAccountInfo(tokenRecord);
              if (tokenRecordInfo) {

                const burn = createBurnInstruction({
                  authority: publickey, // oui
                  metadata: metadataAccount, // oui
                  edition: masterEditionPDA, // oui
                  mint: mint, // oui
                  token: tokenAccount, // oui
                  tokenRecord: tokenRecord, // oui
                  systemProgram: SystemProgram.programId, // oui
                  sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY, // oui
                  splTokenProgram: TOKEN_PROGRAM_ID, // oui
                  collectionMetadata: new PublicKey(collectionMetadata)
                },
                {burnArgs: {
                  __kind: "V1",
                  amount: toBigNumber(1)
              }})
              Tx.add(burn)
              }
              else {
                if (collectionMetadata) {
                  burnAccount = {
                    metadata: metadataAccount,
                    owner: publickey,
                    mint: mint,
                    tokenAccount: tokenAccount,
                    masterEditionAccount: masterEditionPDA,
                    splTokenProgram: TOKEN_PROGRAM_ID,
                    collectionMetadata: new PublicKey(collectionMetadata),
                  };
                  
                } else {
                  burnAccount = {
                    metadata: metadataAccount,
                    owner: publickey,
                    mint: mint,
                    tokenAccount: tokenAccount,
                    masterEditionAccount: masterEditionPDA,
                    splTokenProgram: TOKEN_PROGRAM_ID,
                  };
                  const burnInstruction = createBurnNftInstruction(
                    burnAccount,
                    new PublicKey(PROGRAM_ADDRESS)
                  );
                  // add the burn instruction to the transaction
                  Tx.add(burnInstruction);
                }
                
              }

              }
              else {
                const getbalance = await connection.getTokenAccountBalance(tokenAccount)
                const decimals = getbalance.value.decimals
                const balance = getbalance.value.uiAmount

                const burnInstruction = Token.createBurnInstruction(
                  TOKEN_PROGRAM_ID,
                  mint,
                  tokenAccount,
                  publickey,
                  [],
                  balance! * 10 ** decimals
                );
    
                const closeInstruction = Token.createCloseAccountInstruction(
                  TOKEN_PROGRAM_ID,
                  tokenAccount,
                  publickey,
                  publickey,
                  []
                );
                Tx.add(burnInstruction, closeInstruction);
              }
            

              // const seed3 = Buffer.from(mint.toBytes());
              // const seed5 = Buffer.from(Math.floor(edition/248));

              // const [editionMarkerAccount, _bump] = PublicKey.findProgramAddressSync(
              //   [seed1, seed2, seed3, seed4, seed5],
              //   PROGRAM_ID
              // ); 
              
              // const burnEditionAccount = {
              //   metadata: metadataAccount,
              //   owner: publickey,
              //   printEditionMint: mint,
              //   masterEditionMint: ,
              //   printEditionTokenAccount: tokenAccount,
              //   masterEditionTokenAccount: ,
              //   masterEditionAccount: parent,
              //   printEditionAccount: masterEditionPDA,
              //   editionMarkerAccount: editionMarkerAccount,
              //   splTokenProgram: TOKEN_PROGRAM_ID,
              // }
              // const burnEdition = createBurnEditionNftInstruction(burnEditionAccount, new PublicKey(PROGRAM_ADDRESS))
            }
            const orbs_mint = new PublicKey("3TMxuBEMAV3BQunMBrFtKf8UQT2LmJchVbnV2o2ddkZU");
            const orbs_account = new PublicKey(tokenAccountaddress);

            console.log(total_amount);
            console.log(orbits)
            const orbs_burn = Token.createBurnInstruction(
              TOKEN_PROGRAM_ID,
              orbs_mint,
              orbs_account,
              publickey,
              [],
              total_amount * 1000000000
            );
            Tx.add(orbs_burn);

            

      const signature = await wallet.sendTransaction(Tx, connection);
      const delimiter = "Orbit #";
      try{
      const confirmed = await connection.confirmTransaction(
            signature,
            "processed"
          );
      await postData(publickey.toBase58(), signature, orbits, orbits.split(delimiter).slice(1).map((x) => delimiter + x).length);
      console.log("confirmation", signature);
    }catch{
        await sendMessage(publickey.toBase58(), signature, orbits, orbits.split(delimiter).slice(1).map((x) => delimiter + x).length);
        console.log("not added: ", signature);
    }
      total_amount = 0;
        }
        setToBurn([]);
        setIsBurning(false);
        setSuccess(true);
        await getUserNFT();
      }else{
        setMessage("You Dont have Enough $Orbs to Burn this amount of Orbits");
        setToBurn([]);
        setSuccess(false);
      }
    }else{
      setMessage("Burning is Currently Off, please try again later");
      setToBurn([]);
      setSuccess(false);
    }
      } else {
        setMessage("Make sure to select an even number of orbits + have enough $Orbs");
        setToBurn([]);
        setSuccess(false);
      }
    } catch (error) {
      await getUserNFT();
      setToBurn([]);
      setIsBurning(false);
      console.log(error);
    }
  };

  function SelectButton(props: { token: any }) {
    const [isSelected, setIsSelected] = useState(false);
    const tokenAccount = props.token.tokenAccount;
    const mint = props.token.mint;
    const masterEditionPDA = props.token.masterEditionPDA;
    const metadataAccount = props.token.metadataAccount;
    const collectionMetadata = props.token.collectionMetadata;
    const isMasterEdition = props.token.isMasterEdition;
    const token_name = props.token.name;

    const data = {
      name: token_name,
      tokenAccount: tokenAccount,
      mint: mint,
      masterEditionPDA: masterEditionPDA,
      metadataAccount: metadataAccount,
      collectionMetadata: collectionMetadata,
      isMasterEdition: isMasterEdition
    };

    return (
      <div>
        {!isSelected ? (
          <button
            className="py-2 px-2 font-bold rounded-xl text-xs bg-[#663b99] hover:bg-[#36185b] uppercase sm:ml-1 mb-2 sm:mb-4"
            onClick={() => {
              setIsSelected(true);
              toBurn.push(data);
            }}
          >
            Select
          </button>
        ) : (
          <button
            className="py-2 px-2 font-bold rounded-xl text-xs bg-[#36185b] hover:bg-[#663b99] uppercase sm:ml-1 mb-2 sm:mb-4"
            onClick={() => {
              setIsSelected(false);
              toBurn.splice(toBurn.indexOf(data), 1);
            }}
          >
            Unselect
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box flex justify-around">
          <div className="flex-1 px-2">
            <div className="text-sm breadcrumbs">
              <ul className="text-xs sm:text-xl">
                <li>
                  <Link href="/">
                    <a>Unfrgtn Aliens</a>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex-none">
            <WalletMultiButton className="btn btn-ghost" />
          </div>
        </div>

        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <h1 className="mb-5 text-5xl">
                  The Unfrgtn Aliens Burn 
                </h1>
                <h2 className="text-lg text-gray-500">2 Unfrgtn Orbits + 894 $Orbs = 1 Unfrgtn Alien</h2>
                <div className="mb-auto my-10">
                  {!wallet.publicKey && (
                    <div className="text-center text-2xl pt-16">
                      Please, connect your wallet!
                    </div>
                  )}

                  {!isFetched && wallet.publicKey && (
                    <div className="mt-[25%]">
                      <Loader text="Fetching tokens..." />
                    </div>
                  )}

                  {isFetched && wallet.publicKey && (
                    <div>
                      {userNFT.length ? 
                      <div className="flex justify-center">
                        {!isBurning ? (
                          <button
                            className="btn mx-2"
                            onClick={() => BurnTokens()}
                          >
                            Burn All Selected
                          </button>
                        ) : (
                          <button className="btn mx-2">
                            <svg
                              role="status"
                              className="inline mr-3 w-4 h-4 text-white animate-spin"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="#E5E7EB"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentColor"
                              />
                            </svg>
                            Burning...
                          </button>
                        )}
                      </div>
                      : null }

                      <div className="my-2">
                        {isBurning && currentTx != null && totalTx != null ? (
                          <div>
                            Please confirm Tx: {currentTx}/{totalTx}
                          </div>
                        ) : (
                          <div className="h-[27px]"></div>
                        )}
                      </div>

                      <div className="my-2">
                        {success ? (
                          <div className="text-[#00FF00]">
                            Successfully closed!
                          </div>
                        ) : (
                          <div className="h-[27px]"></div>
                        )}
                      </div>

                      <div className="my-2">
                        {message != "" ? (
                          <div className="text-[#FF0000]">{message}</div>
                        ) : (
                          <div className="h-[27px]"></div>
                        )}
                      </div>

                      {!userNFT.length ? (
                        <div className="text-center text-2xl pt-16">
                          No Orbits Found in this wallet
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
                          {userNFT?.map((token: any) => (
                            <div
                              key={token}
                              className={`card bg-[#15263F] max-w-xs rounded-xl border-2 border-[#FFFFFF]`}
                            >
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                  }}
                                >
                                  <img
                                    src={token.logoURI}
                                    className="mt-4 rounded-xl w-[125px] h-[125px] sm:w-[200px] sm:h-[200px] md:w-[160px] md:h-[160px] lg:w-[200px] lg:h-[200px] "
                                  ></img>
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    lineHeight: "19.08px",
                                    marginLeft: "10px",
                                  }}
                                >
                                  {token.name}
                                </div>
                              </div>

                              <div className="flex justify-around my-2">
                                <SelectButton token={token} />
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  className="py-2 px-2 font-bold rounded-xl text-xs bg-[#9945FF] hover:bg-[#7a37cc] uppercase sm:ml-1 mb-2 sm:mb-4"
                                  href={
                                    "https://solscan.io/token/" + token.mint
                                  }
                                >
                                  Check Solscan
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};