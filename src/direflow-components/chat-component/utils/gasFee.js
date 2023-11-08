const networkConf = {
  137: {
    chainName: "Polygon Mainnet",
    rpcUrls: ["https://polygon-rpc.com/"],
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  80001: {
    chainName: "Mumbai",
    rpcUrls: ["https://matic-mumbai.chainstacklabs.com/"],
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: ["https://mumbai.polygonscan.com"],
  },
};

const waitPayStatus = async (res, handle) => {
  const rec = await window.ethereum.request({
    method: "eth_getTransactionReceipt",
    params: [res],
  });
  if (rec) {
    handle();
  } else {
    setTimeout(() => {
      waitPayStatus(res, handle);
    }, 1000);
  }
};

const switchChain = async (chainId) => {
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [
      {
        chainId: `0x${Number(chainId).toString(16)}`,
      },
    ],
  });
};

const addChain = async (chainId) => {
  const { chainName, rpcUrls, nativeCurrency, blockExplorerUrls } =
    networkConf[chainId];
  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: `0x${Number(chainId).toString(16)}`,
        chainName,
        rpcUrls,
        nativeCurrency,
        blockExplorerUrls,
      },
    ],
  });
  await switchChain(chainId);
};

export const payGasFee = async (chainId, transactions, handle) => {
  if (window.ethereum) {
    if (window.ethereum.networkVersion !== chainId) {
      try {
        await switchChain(chainId);
      } catch (error) {
        if (error.code === 4902) {
          try {
            await addChain(chainId);
          } catch (error) {}
        }
      }
    }

    const res = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: transactions,
    });

    await waitPayStatus(res, handle);
  }
};

export const checkChain = async (chainId, handle) => {
  if (window.ethereum) {
    if (window.ethereum.networkVersion !== chainId) {
      try {
        await switchChain(chainId);
      } catch (error) {
        if (error.code === 4902) {
          try {
            await addChain(chainId);
          } catch (error) {}
        }
      }
    }
    handle();
  }
};
