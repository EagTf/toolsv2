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
      </Head>
      <BurnNFTView />
      <Footer/>
    </div>
  );
};

export default Home;