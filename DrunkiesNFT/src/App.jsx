import "./App.css";
import axios from "axios";
import Toast from "./Toast";
import { ethers } from "ethers";
import InputField from "./Input";
import { contract } from "./contract";
import toast, { Toaster } from "react-hot-toast";
import { useEffect, useReducer, useState } from "react";

function App() {
	const [error, setError] = useState();
	const [tokenUri, setTokenUri] = useState();
	const [tokenIdState, setTokenIdState] = useState();
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
			if (checkFreeMintAvailable) {
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

	const onPayMint = async () => {
		try {
			const metaHash = "QmfGCSSTFSREL4ECqTfcTggEHSMyeDzqpiVr5SrUsptbK1";
			const provider = new ethers.providers.Web3Provider(window?.ethereum);
			const signer = provider.getSigner();
			const contractConnector = new ethers.Contract(
				contract.address,
				contract.abi,
				signer
			);

			const mintingToken = await contractConnector.mintNFT(metaHash, {
				value: ethers.utils.parseUnits("0.03", "ether"),
			});

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

	const onFreeMint = async () => {
		try {
			const metaHash = "QmfGCSSTFSREL4ECqTfcTggEHSMyeDzqpiVr5SrUsptbK1";
			const provider = new ethers.providers.Web3Provider(window?.ethereum);
			const signer = provider.getSigner();
			const contractConnector = new ethers.Contract(
				contract.address,
				contract.abi,
				signer
			);

			const mintingToken = await contractConnector.freeMint(metaHash);

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
			} else if (error.message.includes("Free mint not available")) {
				console.log("Free mint not available");
				setError("Free mint not available");
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

	const processCsvData = async () => {
		const csvData = "name,age,cityJohn,25,New YorkAlice,30,San Francisco";
		// // Convert the CSV data to bytes
		// const csvBytes = ethers.utils.toUtf8Bytes(csvData);

		// // Encode the bytes using Base64
		// const encodedCSV = ethers.utils.base64.encode(csvBytes);

		// Decode the Base64 encoded CSV data to bytes
		const decodedBytes = ethers.utils.base64.decode(csvData);

		const provider = new ethers.providers.Web3Provider(window?.ethereum);
		const signer = provider.getSigner();
		const contractConnector = new ethers.Contract(
			contract.address,
			contract.abi,
			signer
		);

		// Call the smart contract function with the encoded CSV data
		const tx = await contractConnector.processCSVData(decodedBytes);

		// Wait for the transaction to be mined
		const receipt = await tx.wait();
		console.log("receipt", receipt);

		// // Get the return value (sum of ages) from the transaction receipt
		// const sumOfAges = receipt.events[0].args.sumOfAges;
		// console.log("Sum of ages:", sumOfAges.toString());
	};

	useEffect(() => {}, []);

	return (
		<div className="App">
			{error && (
				<Toast message={error} type={"error"} messageController={resetError} />
			)}
			<div className="flex flex-1 w-screen h-screen justify-center items-center flex-col">
				<div className="my-5">
					<button className="w-52 h-20" onClick={() => handleConnect()}>
						Connect Wallet
					</button>
				</div>
				{walletData.walletAddress && walletData.network && (
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
								Wallet balance {`${Number(walletData.balance).toFixed(2)} eth`}
							</span>
						</div>
					</div>
				)}
				<div className="my-5">
					<button className="w-52 h-20" onClick={() => onMint()}>
						Mint Drunkies Token
					</button>
				</div>
				<div className="my-5">
					<button className="w-52 h-20" onClick={() => onPayMint()}>
						Pay Mint Token
					</button>
				</div>
				<div className="my-5">
					<button className="w-52 h-20" onClick={() => onFreeMint()}>
						Free Mint Token
					</button>
				</div>

				<div className="max-w-xl mx-auto my-5 bg-black text-white rounded-xl shadow-md">
					<div className="p-8">
						<InputField
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
						</div>

						<div className="text-base text-indigo-500 font-semibold my-2 mt-5">
							<button className="w-full h-20" onClick={() => processCsvData()}>
								Process CSV Data
							</button>
						</div>
					</div>
				</div>

				<div className="max-w-xl mx-auto my-5 bg-black text-white rounded-xl shadow-md">
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
				</div>
			</div>
		</div>
	);
}

export default App;
