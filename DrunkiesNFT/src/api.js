export const uploadMetadataToPinata = async () => {
	const metadata = {
		name: "Drunkies Mint Pass",
		tokenURI:
			"https://ipfs.io/ipfs/QmSU33h3Q4qyDhnz9cZnhfgeJFmJcU8duzxBZv1LMahkCE",
	};
	const apiEndpoint = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

	const options = {
		headers: {
			"Content-Type": "application/json",
			pinata_api_key: "956bebdeba6d10b92803",
			pinata_secret_api_key:
				"6d91fa0d715fb983cb7d0924c86568b8b0e5078a5424513a0f2ea57ac96c208d",
		},
	};

	try {
		const response = await axios.post(apiEndpoint, metadata, options);
		const metaHash = `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
		console.log(metaHash);

		return metaHash;
	} catch (error) {
		console.error(error);
	}
};
