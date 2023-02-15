import { Contract, providers, utils, BigNumber } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
} from "./constants.js";

/**
 * removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from liquidity and also the calculated amount of `ether` and `DD` tokens;
 */

export const removeLiquidity = async (signer, removeLPTokensWei) => {
  // Create a new instance of the exchange contract
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    signer
  );

  const tx = await exchangeContract.removeLiquidity(removeLPTokensWei);
  await tx.wait();
};

/**
 * getTokensAfterRemove : Calculatest the amount of `Eth` and `DD` tokens that
 * would be returned back to the user after he removes `removeLPTokenWei` amount of LP tokens from the contract
 */

export const getTokensAfterRemove = async (
  provider,
  removeLPTokenWei,
  _ethBalance,
  deDevTokenReserve
) => {
  try {
    // Create a new instance of the exchange Contract
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );

    // Get the total supply of `De Dev` LP tokens
    const _totalSupply = await exchangeContract.totalSupply();
    // Here we are using the BigNumber methods of multiplication and division
    const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
    const _removeDD = deDevTokenReserve.mul(removeLPTokenWei).div(_totalSupply);

    return {
        _removeEther,
        _removeDD
    }
  } catch (error) {
    console.log("Error Removing Liquidity", error);
  }
};
