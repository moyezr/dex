import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import Image from "next/image"
import React, { useEffect, useState } from "react";
import { useDexContext } from "../utils/dexContext";
import deDev from "../public/cryptodev.svg";

import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../utils/constants";
import styles from "../styles/Mint.module.css";

export default function Home() {
  // Importing Utility Functions from DexContext
  const { getProviderOrSigner, connectWallet, walletConnected } = useDexContext();

  // Create a BigNumber `0`
  const zero = BigNumber.from(0);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // tokensToBeClaimed keeps track of the number of tokens that can be claimed
  // based on the De Dev NFT's held by the user for which they havent claimed the tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  // balanceOfDeDevTokens keeps track of number of De Dev tokens owned by an address
  const [balanceOfDeDevTokens, setBalanceOfDeDevTokens] =
    useState(zero);
  // amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
  const [tokensMinted, setTokensMinted] = useState(zero);
  // isOwner gets the owner of the contract through the signed address
  const [isOwner, setIsOwner] = useState(false);

  /**
   * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
   */
  const getTokensToBeClaimed = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // Create an instance of NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // Create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the balanceOf from the NFT contract to get the number of NFT's held by the user
      const balance = await nftContract.balanceOf(address);
      // balance is a Big number and thus we would compare it with Big number `zero`
      if (balance === zero) {
        setTokensToBeClaimed(0);
      } else {
        // Check if the user Address has already claimed the tokens or not
          const claimed = await tokenContract.isClaimed(address);
          console.log("is claimed ", claimed);
          if(claimed) {
            setTokensToBeClaimed(0);
          } else {
            setTokensToBeClaimed(balance.toNumber());
          }
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };

  /**
   * getBalanceOfDeDevTokens: checks the balance of De Dev Tokens's held by an address
   */
  const getBalanceOfDeDevTokens = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // Create an instance of token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the balanceOf from the token contract to get the number of tokens held by the user
      const balance = await tokenContract.balanceOf(address);
      // balance is already a big number, so we dont need to convert it before setting it
      setBalanceOfDeDevTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfDeDevTokens(zero);
    }
  };

  /**
   * mintDeDevToken: mints `amount` number of tokens to a given address
   */
  const mintDeDevToken = async (amount) => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      // Create an instance of tokenContract
      const signer = await getProviderOrSigner(true);
      // Create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value signifies the cost of one de dev token which is "0.001" eth.
        // We are parsing `0.001` string to ether using the utils library from ethers.js
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted De Dev Tokens");
      await getBalanceOfDeDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * claimDeDevTokens: Helps the user claim De Dev Tokens
   */
  const claimDeDevTokens = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      // Create an instance of tokenContract
      const signer = await getProviderOrSigner(true);
      // Create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully claimed De Dev Tokens");
      await getBalanceOfDeDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      window.alert("Failed to claim de Dev tokens");
      console.error(err);
    }
  };

  /**
   * getTotalTokensMinted: Retrieves how many tokens have been minted till now
   * out of the total supply
   */
  const getTotalTokensMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // Create an instance of token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Get all the tokens that have been minted
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getOwner: gets the contract owner by connected address
   */
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // call the owner function from the contract
      const _owner = await tokenContract.owner();
      // we get signer to extract address of currently connected Metamask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to signer which is connected to Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * withdrawCoins: withdraws ether by calling
   * the withdraw function in the contract
   */
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err);
      window.alert(err.reason);
    }
  };



  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      connectWallet();

    } else {
      getTotalTokensMinted();
      getBalanceOfDeDevTokens();
      getTokensToBeClaimed();
      getOwner();
    }
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimDeDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintDeDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>De Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to De Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint De Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfDeDevTokens)} Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
              {/* Display additional withdraw button if connected wallet is owner */}
                {isOwner ? (
                  <div>
                  {loading ? <button className={styles.button}>Loading...</button>
                           : <button className={styles.button} onClick={withdrawCoins}>
                               Withdraw Coins
                             </button>
                  }
                  </div>
                  ) : ("")
                }
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <Image className={styles.image} alt="De Dev" src={deDev} />
        </div>
      </div>
    </div>
  );
}