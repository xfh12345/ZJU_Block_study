import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
      ganache: {
        // Change the url according to your ganache configuration
        url: 'http://127.0.0.1:8545',
        // Change these accounts private keys according to your ganache configuration.
        accounts: [
          '875925cf46547850a98561be700538ba7f9fc8367888a624ef8347e20c9c873f',
          'fe60b10f3fc9eb45804198a4a7fb2651ff31ffa0db95023659ab2793557756ce',
          '639b9194cad676122da184c4e1dc4a07666ebd8e3baa894ad3ad57adee3808bf',
          '28470e948b2970256d992dd8fdbf4050690642af1476dd808a0994e2765688fa',
          '18323a8da2fb29a190ceab191fb8b1b359985a0d13bbb52386c66e46003cd4ce',
          'e855d3c00af22b2857a7c29a4edf5804dbf702237a99de07ae1c126b5b6a55b8',
        ]
      },
    },
    paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
    },
};

export default config;
