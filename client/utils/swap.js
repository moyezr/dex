import { Contract } from "ethers";

import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS
} from "./constants";

/**
 * getAmountOfTokensRecievedFromSwap: Returns the number of Eth/De Dev tokens that can be recieved
 * when the user swaps `_swapAmountWei` amount of Eth/De Dev tokens.
 */

export const getAmountOfTokenReceivedFromSwap = async (
    _swapAmountWei,
    provider,
    ethSelected,
    ethBalance,
    reservedDD
) => {
    // Create a new instance of the exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );

    let amountOfTokens;
  // If `Eth` is selected this means our input value is `Eth` which means our input amount would be
  // `_swapAmountWei`, the input reserve would be the `ethBalance` of the contract and output reserve
  // would be the `De Dev` token reserve

  if(ethSelected) {
    amountOfTokens = await exchangeContract.getAmountOfTokens(
        _swapAmountWei,
        ethBalance,
        reservedDD
    );
  } else {
        // If `Eth` is not selected this means our input value is `De Dev` tokens which means our input amount would be
    // `_swapAmountWei`, the input reserve would be the `De Dev` token reserve of the contract and output reserve
    // would be the `ethBalance`
    amountOfTokens = await exchangeContract.getAmountOfTokens(
        _swapAmountWei,
        reservedDD,
        ethBalance
    );
  }

  return amountOfTokens;
}

/**
 * swapTokens: Swaps `swapAmountWei` of Eth/De Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth/De Dev tokens.
 */

export const swapTokens = async (
    signer,
    swapAmountWei,
    tokenToBeReceivedAfterSwap,
    ethSelected
) => {
    // Create a new instance of the exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );

    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
    );

    let tx;
      // If Eth is selected call the `ethToDeDevToken` function else
  // call the `deDevTokenToEth` function from the contract
  // As you can see you need to pass the `swapAmount` as a value to the function because
  // it is the ether we are paying to the contract, instead of a value we are passing to the function

  if(ethSelected) {
    tx = await exchangeContract.ethToDeDevToken(
        tokenToBeReceivedAfterSwap,
        {
            value: swapAmountWei
        }
    );
  } else {
        // User has to approve `swapAmountWei` for the contract because `De Dev` token is an ERC20
        tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            swapAmountWei.toString()
        );

        await tx.wait();
// call deDevTokenToEth function which would take in `swapAmountWei` of `De Dev` tokens and would
    // send back `tokenToBeReceivedAfterSwap` amount of `Eth` to the user

    tx = await exchangeContract.ethToDeDevToken(
        swapAmountWei,
        tokenToBeReceivedAfterSwap
    );
  }
  await tx.wait();
}