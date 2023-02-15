import { providers } from "ethers";
import { useEffect, useRef, useState } from "react";
import React, { useContext} from "react";
import Web3Modal from "web3modal";


const DexContext = React.createContext();

const DexProvider = ({children}) => {

      /** Wallet connection */
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  // currentAddress keeps track of the current connected Address
  const [currentAddress, setCurrentAddress] = useState("")
/**
   * Returns a Provider or Signer object representing the Ethereum RPC with or
   * without the signing capabilities of Metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading
   * transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction
   * needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being
   * sent. Metamask exposes a Signer API to allow your website to request
   * signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false
   * otherwise
   */
const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    console.log("Wallet Connected");
    const signer = web3Provider.getSigner();
    const addr = await signer.getAddress();
    setCurrentAddress(addr)

    if (needSigner) {
      return signer;
    }
    return web3Provider;
  };

  /**
   * connectWallet: Connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() =>{
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
        // Assign the Web3Modal class to the reference object by setting it's `current` value
        // The `current` value is persisted throughout as long as this page is open
        web3ModalRef.current = new Web3Modal({
          network: "goerli",
          providerOptions: {},
          disableInjectedProvider: false,
        });
        if(web3ModalRef.current){
          connectWallet();
        }
      }
  }, [walletConnected])

  return (
    <DexContext.Provider value={{
        connectWallet,
        getProviderOrSigner,
        walletConnected,
        currentAddress,
        web3ModalRef
    }}>
    {children}
    </DexContext.Provider>
  )
}

export const useDexContext = () => {
    return useContext(DexContext);
}

export default DexProvider;

