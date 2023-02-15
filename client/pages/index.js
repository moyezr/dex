import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import Image from "next/image"
import deDev from "../public/cryptodev.svg";
import React, { useEffect, useRef, useState } from "react";
import { useDexContext } from "../utils/dexContext";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateDD } from "../utils/addLiquidity";
import {
  getDDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfDDTokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";
import { WEB3_CONNECT_MODAL_ID } from "web3modal";

export default function Home() {

    // Importing Utility Functions from DexContext
    const { getProviderOrSigner, connectWallet, walletConnected, web3ModalRef } = useDexContext();
  /** General state variables */
  // loading is set to true when the transaction is mining and set to false when
  // the transaction has mined
  const [loading, setLoading] = useState(false);
    // This variable is the `0` number in form of a BigNumber
    const zero = BigNumber.from(0);
  // We have two tabs in this dapp, Liquidity Tab and Swap Tab. This variable
  // keeps track of which Tab the user is on. If it is set to true this means
  // that the user is on `liquidity` tab else he is on `swap` tab
  const [liquidityTab, setLiquidityTab] = useState(true);

  /** Variables to keep track of amount */
  // `ethBalance` keeps track of the amount of Eth held by the user's account
  const [ethBalance, setEtherBalance] = useState(zero);
  // `reservedDD` keeps track of the De Dev tokens Reserve balance in the Exchange contract
  const [reservedDD, setReservedDD] = useState(zero);
  // Keeps track of the ether balance in the contract
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  // ddBalance is the amount of `DD` tokens help by the users account
  const [ddBalance, setDDBalance] = useState(zero);
  // `lpBalance` is the amount of LP tokens held by the users account
  const [lpBalance, setLPBalance] = useState(zero);
  /** Variables to keep track of liquidity to be added or removed */
  // addEther is the amount of Ether that the user wants to add to the liquidity
  const [addEther, setAddEther] = useState(zero);
  // addDDTokens keeps track of the amount of DD tokens that the user wants to add to the liquidity
  // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
  // DD tokens that the user can add given a certain amount of ether
  const [addDDTokens, setAddDDTokens] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // removeDD is the amount of `De Dev` tokens that would be sent back to the user based on a certain number of `LP` tokens
  // that he wants to withdraw
  const [removeDD, setRemoveDD] = useState(zero);
  // amount of LP tokens that the user wants to remove from liquidity
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  /** Variables to keep track of swap functionality */
  // Amount that the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  // This keeps track of the number of tokens that the user would receive after a swap completes
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] =
    useState(zero);
  // Keeps track of whether  `Eth` or `De Dev` token is selected. If `Eth` is selected it means that the user
  // wants to swap some `Eth` for some `De Dev` tokens and vice versa if `Eth` is not selected
  const [ethSelected, setEthSelected] = useState(true);


  /**
   * getAmounts call various functions to retrive amounts for ethbalance,
   * LP tokens etc
   */
  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      // get the amount of eth in the user's account
      const _ethBalance = await getEtherBalance(provider, address);
      // get the amount of `De Dev` tokens held by the user
      const _ddBalance = await getDDTokensBalance(provider, address);
      // get the amount of `De Dev` LP tokens held by the user
      const _lpBalance = await getLPTokensBalance(provider, address);
      // gets the amount of `DD` tokens that are present in the reserve of the `Exchange contract`
      const _reservedDD = await getReserveOfDDTokens(provider);
      // Get the ether reserves in the contract
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setDDBalance(_ddBalance);
      setLPBalance(_lpBalance);
      setReservedDD(_reservedDD);
      setReservedDD(_reservedDD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };

  /**** SWAP FUNCTIONS ****/

  /**
   * swapTokens: Swaps  `swapAmountWei` of Eth/De Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth/De Dev tokens.
   */
  const _swapTokens = async () => {
    try {
      // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
      const swapAmountWei = utils.parseEther(swapAmount);
      // Check if the user entered zero
      // We are here using the `eq` method from BigNumber class in `ethers.js`
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // Call the swapTokens function from the `utils` folder
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
        // Get all the updated amounts after the swap
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };

  /**
   * _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/De Dev tokens that can be received
   * when the user swaps `_swapAmountWEI` amount of Eth/De Dev tokens.
   */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      // Check if the user entered zero
      // We are here using the `eq` method from BigNumber class in `ethers.js`
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
        // Get the amount of ether in the contract
        const _ethBalance = await getEtherBalance(provider, null, true);
        // Call the `getAmountOfTokensReceivedFromSwap` from the utils folder
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedDD
        );
        settokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        settokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /*** END ***/

  /**** ADD LIQUIDITY FUNCTIONS ****/

  /**
   * _addLiquidity helps add liquidity to the exchange,
   * If the user is adding initial liquidity, user decides the ether and DD tokens he wants to add
   * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
   * then we calculate the de dev tokens he can add, given the Eth he wants to add by keeping the ratios
   * constant
   */
  const _addLiquidity = async () => {
    try {
      // Convert the ether amount entered by the user to Bignumber
      const addEtherWei = utils.parseEther(addEther.toString());
      // Check if the values are zero
      if (!addDDTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // call the addLiquidity function from the utils folder
        await addLiquidity(signer, addDDTokens, addEtherWei);
        setLoading(false);
        // Reinitialize the DD tokens
        setAddDDTokens(zero);
        // Get amounts for all values after the liquidity has been added
        await getAmounts();
      } else {
        setAddDDTokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddDDTokens(zero);
    }
  };

  /**** END ****/

  /**** REMOVE LIQUIDITY FUNCTIONS ****/

  /**
   * _removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
   * liquidity and also the calculated amount of `ether` and `DD` tokens
   */
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      // Call the removeLiquidity function from the `utils` folder
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveDD(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveDD(zero);
      setRemoveEther(zero);
    }
  };

  /**
   * _getTokensAfterRemove: Calculates the amount of `Ether` and `DD` tokens
   * that would be returned back to user after he removes `removeLPTokenWei` amount
   * of LP tokens from the contract
   */
  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // Get the Eth reserves within the exchange contract
      const _ethBalance = await getEtherBalance(provider, null, true);
      // get the de dev token reserves from the contract
      const deDevTokenReserve = await getReserveOfDDTokens(provider);
      // call the getTokensAfterRemove from the utils folder
      const { _removeEther, _removeDD } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        deDevTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveDD(_removeDD);
    } catch (err) {
      console.error(err);
    }
  };

  /**** END ****/



  
  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    if (walletConnected) {
      getAmounts();
    }
  }, [walletConnected]);

  /*
      renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button1}>
          Connect Wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (liquidityTab) {
      return (
        <div className={styles.liquidity_box}>
        <h3 className={styles.sub_heading}> Add Liquidity -&gt; </h3>
          <div className={styles.description}>
            You have:
            <br />
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {utils.formatEther(ddBalance)} De Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} De Dev LP tokens
          </div>
          <div>
            {/* If reserved DD is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `DD` tokens can be added */}
            {utils.parseEther(reservedDD.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of DeDev tokens"
                  onChange={(e) =>
                    setAddDDTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the number of DD tokens that
                    // can be added given  `e.target.value` amount of Eth
                    const _addDDTokens = await calculateDD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedDD
                    );
                    setAddDDTokens(_addDDTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addDDTokens)} De Dev
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            {lpBalance > "0" ?(
              <div className={styles.liquidity_box}>
        <h3 className={styles.sub_heading}> Remove Liquidity -&gt; </h3>

              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  // Calculate the amount of Ether and DD tokens that the user would receive
                  // After he removes `e.target.value` amount of `LP` tokens
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                {`You will get ${utils.formatEther(removeDD)} De
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
            ) : null}
            
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="deDevToken">De Dev Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} De Dev Tokens`
              : `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>De Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; De Dev Tokens
          </div>
          <div className={styles.tab_container}>
            <button
              className={`${styles.tab_button} ${liquidityTab ? styles.active_tab : null}`}
              onClick={() => {
                setLiquidityTab(true);
              }}
            >
              Liquidity
            </button>
            <button
              className={`${styles.tab_button} ${!liquidityTab ? styles.active_tab : null}`}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <Image className={styles.image} src={deDev} alt="DeDev" />
        </div>
      </div>

    </div>
  );
}