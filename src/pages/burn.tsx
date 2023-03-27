import type { NextPage } from "next";
import Head from "next/head";
import { BurnNFTView } from "../views";
import Footer from "components/Footer";

const Home: NextPage = (props) => {
  return (
    <div className=" flex flex-col h-screen justify-between">
      <Head>
        <title>Unfrgtn Aliens</title>
        <meta name="description" content="Unfrgtn Aliens Tools" />
        <meta property="og:title" content="Unfrgtn Aliens" />
        <meta property="og:description" content="Unfrgtn Aliens Burn Event" />
        <meta property="og:url" content="https://burn.unfrgtn.space/burn" />
        <meta property="og:image" content="https://cdn.discordapp.com/attachments/959044852249686067/1089650574326239242/VTYuHIfZ_400x400.jpg" />
      </Head>
      <BurnNFTView />
      <Footer/>
    </div>
  );
};

export default Home;