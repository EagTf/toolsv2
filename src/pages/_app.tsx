import React from "react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";

// set custom RPC server endpoint for the final website
// const endpoint = "https://explorer-api.devnet.solana.com";
// const endpoint = "http://127.0.0.1:8899";
// const endpoint = "https://ssc-dao.genesysgo.net";
 //const endpoint = "https://solana-api.projectserum.com";
  //const endpoint = "https://api.mainnet-beta.solana.com";
//const endpoint = "https://rpc.helius.xyz/?api-key=cc778adb-f9ab-45da-ba44-b4096f663c16";
 //const endpoint = "https://solana-mainnet.g.alchemy.com/v2/sYgwLczvejgglh0khGG1CVrmckCYrtIh"
// const endpoint = "https://try-rpc.mainnet.solana.blockdaemon.tech";
//const endpoint = "https://little-delicate-hill.solana-mainnet.discover.quiknode.pro/65363c55d9e7e8a4bcc1a62ec422400ea0aa7b20/";
//const endpoint = "https://rpc.ankr.com/solana/69888ad83a2afe04825141afaa54e992ba0016b33aed81f0b7202b072ed97c86";
const endpoint = "https://rpc.helius.xyz/?api-key=071df3fc-1b02-413e-8879-fa0b6019ddf6"

const WalletProvider = dynamic(
  () => import("../contexts/ClientWalletProvider"),
  {
    ssr: false,
  }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect={true}>
        <Component {...pageProps} />
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
