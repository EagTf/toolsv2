import { PIPButton } from "@getpip/react-pip-button";

import { PIPButtonCustom } from "./PIPButtonCustom";

const Footer = () => {
  return (
    <footer className="text-center text-white">
      <div className="text-center text-white pb-2">
        Go to
        <a
          target="_blank"
          rel="noreferrer"
          className="text-white"
          href="https://dash.unfrgtn.space/"
        >
          {" "}
          <strong className="underline">Dashboard</strong>
        </a>
      </div>
      <div className="text-center text-white text-sm pb-2">
        Made with ❤️ By
        <a
          target="_blank"
          rel="noreferrer"
          className="text-white"
          href="https://twitter.com/unfrgtnorbit"
        >
          {" "}
          <strong>Unfrgtn Orbit</strong>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
