import "./App.css";
import axios from "axios";
import Toast from "./Toast";
import { ethers } from "ethers";
import InputField from "./Input";
import { contract, contractConnector } from "./contract";
import toast, { Toaster } from "react-hot-toast";
import { useEffect, useReducer, useState } from "react";
import Papa from "papaparse";

function App() {
  const [error, setError] = useState();
  const [tokenUri, setTokenUri] = useState();
  const [tokenIdState, setTokenIdState] = useState();
  const [numberOfTokens, setNumberOfTokens] = useState(0);
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState(false);
  const [walletData, setWalletData] = useReducer(
    (prev, next) => {
      return { ...prev, ...next };
    },
    {
      signer: null,
      balance: null,
      network: null,
      provider: null,
      walletAddress: null,
    }
  );

  const handleConnect = async () => {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window?.ethereum);

    const requestAccounts = await provider.send("eth_requestAccounts", []);
    const account = requestAccounts[0];
    const signer = provider.getSigner();
    const balance = await signer.getBalance();
    const network = await provider.getNetwork();
    const balanceFormatted = ethers.utils.formatEther(balance);

    const walletDataObject = {
      provider,
      signer,
      network,
      walletAddress: account,
      balance: balanceFormatted,
    };

    setWalletData({
      ...walletDataObject,
    });
  };

  const onMint = async () => {
    try {
      const metaHash = "QmfGCSSTFSREL4ECqTfcTggEHSMyeDzqpiVr5SrUsptbK1";
      const provider = new ethers.providers.Web3Provider(window?.ethereum);
      const signer = provider.getSigner();
      const contractConnector = new ethers.Contract(
        contract.address,
        contract.abi,
        signer
      );

      let mintingToken;
      const checkFreeMintAvailable =
        await contractConnector.checkFreeMintAvailable();
      const availableFreeTokens =
        await contractConnector.getNumberOfFreeTokens();
      if (checkFreeMintAvailable && availableFreeTokens >= 1) {
        mintingToken = await contractConnector.freeMint(metaHash);
        console.log(`NFT Minted With Token ID`, mintingToken);
      } else {
        mintingToken = await contractConnector.mintNFT(metaHash, {
          value: ethers.utils.parseUnits("0.03", "ether"),
        });
        console.log("NFT Minted With Token ID", mintingToken);
      }

      await provider.waitForTransaction(mintingToken.hash);
      const tokenHash = await provider.getTransactionReceipt(mintingToken.hash);
      const tokenId = parseInt(tokenHash.logs[0].topics[3], 16);
      setTokenIdState(tokenId);

      const tokenUriData = await contractConnector.tokenURI(tokenId);
      setTokenUri(tokenUriData);
    } catch (error) {
      if (error.message.includes("insufficient funds")) {
        console.log("Insufficient funds");
        setError("Insufficient funds");
      } else if (error.message.includes("Need to send 0.03 ether")) {
        console.log("Need to send 0.03 ether");
        setError("Need to send 0.03 ether");
      } else if (error.message.includes("Invalid token ID")) {
        console.log("Invalid token ID");
        setError("Invalid token ID");
      } else if (error.message.includes("You cannot buy your own token")) {
        console.log("You cannot buy your own token");
        setError("You cannot buy your own token");
      }
    }
  };

  const onBuyToken = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window?.ethereum);
      const signer = provider.getSigner();
      const contractConnector = new ethers.Contract(
        contract.address,
        contract.abi,
        signer
      );

      let tokenId = tokenIdState.toString();

      const buyingToken = await contractConnector.buyNFT(tokenId, {
        value: ethers.utils.parseUnits("0.03", "ether"),
      });

      await provider.waitForTransaction(buyingToken.hash);
      const tokenHash = await provider.getTransactionReceipt(mintingToken.hash);
    } catch (error) {
      if (error.message.includes("insufficient funds")) {
        console.log("Insufficient funds");
        setError("Insufficient funds");
      } else if (error.message.includes("Need to send 0.03 ether")) {
        console.log("Need to send 0.03 ether");
        setError("Need to send 0.03 ether");
      } else if (error.message.includes("Invalid token ID")) {
        console.log("Invalid token ID");
        setError("Invalid token ID");
      } else if (error.message.includes("You cannot buy your own token")) {
        console.log("You cannot buy your own token");
        setError("You cannot buy your own token");
      }
    }
  };

  const handleSetInputField = (value) => {
    setTokenIdState(value);
  };

  const resetError = () => {
    setTokenIdState();
  };

  useEffect(() => {
    window.ethereum.on("accountsChanged", function () {
      handleConnect();
    });

    walletData?.walletAddress && CheckOwner();
  }, [walletData]);

  const CheckOwner = async () => {
    const contractOwner = await contractConnector.owner();
    if (
      walletData?.walletAddress.toLowerCase() == contractOwner.toLowerCase()
    ) {
      setOwner(true);
    } else {
      setOwner(false);
    }
  };

  const handleFileSelected = async (e) => {
    // debugger;
    setLoading(true);
    if (owner) {
      let walletAddressData;
      Papa.parse(e.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: async function (results) {
          //   debugger;
          walletAddressData = results.data.map((item) => item.wallet_address);

          try {
            const tx = await contractConnector.storeWalletAddress(
              walletAddressData
            );
            console.log("Successfully Stored..", tx);
            setLoading(false);
          } catch (e) {
            console.log(e);
            setLoading(false);
          }
        },
      });
    } else {
      alert("You are not owner..");
      setLoading(false);
    }
  };

  const onBulkMint = async () => {
    // debugger;
    const metaHash = "QmfGCSSTFSREL4ECqTfcTggEHSMyeDzqpiVr5SrUsptbK1";
    let mintingToken;
    const checkFreeMintAvailable =
      await contractConnector.checkFreeMintAvailable();
    if (checkFreeMintAvailable) {
      const availableFreeTokens =
        await contractConnector.getNumberOfFreeTokens();

      const requiredEth = numberOfTokens - availableFreeTokens.toString();

      mintingToken = await contractConnector.bulkFreeMintNFT(
        metaHash,
        numberOfTokens,
        {
          value: ethers.utils.parseUnits(`${requiredEth * 0.03}`, "ether"),
        }
      );
      console.log(`${numberOfTokens} NFT Minted`);
    } else {
      mintingToken = await contractConnector.bulkMintNFT(
        metaHash,
        numberOfTokens,
        {
          value: ethers.utils.parseUnits(`${numberOfTokens * 0.03}`, "ether"),
        }
      );
      console.log(`${numberOfTokens} NFT Minted`);
    }
  };

  return (
    <div className="App">
      {error && (
        <Toast message={error} type={"error"} messageController={resetError} />
      )}
      <div className="flex flex-1 w-screen h-full justify-center items-center flex-col">
        {!walletData.walletAddress && (
          <div className="my-5">
            <button className="w-52 h-20" onClick={() => handleConnect()}>
              Connect Wallet
            </button>
          </div>
        )}
        {walletData.walletAddress && walletData.network && (
          <>
            <div className="flex flex-col my-5">
              <div className="flex justify-center">
                <span className="font-normal">
                  Connected to{" "}
                  {walletData.network.name !== "unknown"
                    ? walletData.network.name
                    : "Sepolia"}
                </span>
              </div>
              <div className="flex justify-center">
                <span className="font-normal">
                  Wallet balance{" "}
                  {`${Number(walletData.balance).toFixed(2)} eth`}
                </span>
              </div>
            </div>

            {/* <div className="my-5">
              <button className="w-52 h-20" onClick={() => onMint()}>
                Mint Drunkies Token
              </button>
            </div> */}
            <div className="flex flex-col my-5">
              <InputField
                test="text"
                name="tokenIdState"
                placeholder="Enter Number of Tokens"
                value={numberOfTokens}
                onChange={(e) => setNumberOfTokens(e)}
              />
              <button className="w-52 h-20 mt-2.5" onClick={() => onBulkMint()}>
                Mint Drunkies Token
              </button>
            </div>

            <div className="flex justify-center">
              <span className="font-normal">
                <a
                  href={`https://sepolia.etherscan.io/address/${walletData?.walletAddress}`}
                  className="block mt-1 text-base leading-tight font-medium hover:underline"
                >
                  Etherscan
                </a>
              </span>
            </div>

            {owner && (
              <div className="max-w-xl mx-auto my-5 bg-black text-white rounded-xl shadow-md">
                <div className="p-8">
                  {/* <InputField
                  test="text"
                  name="tokenIdState"
                  placeholder="Enter Token ID"
                  value={tokenIdState}
                  onChange={handleSetInputField}
                />
                <div className="text-base text-indigo-500 font-semibold my-2 mt-5">
                  <button className="w-full h-20" onClick={() => onBuyToken()}>
                    Buy Minted Token
                  </button>
                </div> */}

                  <div className="text-base text-indigo-500 font-semibold my-2 mt-5">
                    {loading ? (
                      <div className="flex items-center justify-center w-56 h-56 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <div role="status">
                          <svg
                            aria-hidden="true"
                            className="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="currentColor"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentFill"
                            />
                          </svg>
                          <span className="sr-only">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-file"
                          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 mx-2.5">
                            <svg
                              aria-hidden="true"
                              className="w-10 h-10 mb-3 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              ></path>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              SVG, PNG, JPG or GIF (MAX. 800x400px)
                            </p>
                          </div>
                          <input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            onChange={handleFileSelected}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/*  <div className="max-w-xl mx-auto my-5 bg-black text-white rounded-xl shadow-md">
              <div className="md:flex">
                <div className="p-8">
                  <div className="uppercase tracking-wide text-xl text-indigo-500 font-semibold my-2">
                    NFT Mint Pass
                  </div>
                  {tokenIdState && (
                    <div className="tracking-wide text-base text-indigo-500 font-semibold my-2">
                      Token ID is {tokenIdState}
                    </div>
                  )}
                  <a
                    href={tokenUri ? tokenUri : "#"}
                    className="block mt-1 text-base leading-tight font-medium hover:underline"
                  >
                    Link to NFT metadata
                  </a>
                </div>
              </div>
            </div> */}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
