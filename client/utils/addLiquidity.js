import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "./constants";

/**
 * addLiquidity help add liquidity to the exchange, If the user is adding initial liquidity, user decides the ether and DD tokens he wants to add to theexchange. If he is adding the liquidity after the initial liquidity has already been added
 * then we calculate the De Dev tokens he can add, given the Eth he wants to add by keeping the ratios contant
 */

export const addLiquidity = async (
  signer,
  addDDAmountWei,
  addEtherAmountWei
) => {
  try {
    // create a new instance of the token contract
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );

    // create a new instance of exchange contrat
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );

    // Because DD tokens are an ERC20, user would need to give the contract allowance to take the required number DD tokens out of his contract

    let tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      addDDAmountWei.toString()
    );
    await tx.wait();

    // After the contract has the approval, add the ether and dd tokens in the liqiuidity pool
    tx = await exchangeContract.addLiquidity(addDDAmountWei, {
      value: addEtherAmountWei,
    });

    tx.wait();
  } catch (error) {
    console.log("Error adding liquidity", error);
  }
};

/*
    calculateDD calculates the DD tokens that need to be added to the liquidity give `_addEtherAmountWei` amount of ether
*/

export const calculateDD = async (
  _addEther = "0",
  etherBalanceContract,
  ddTokenReserve
) => {
  // `_addEther` is a string, we need to convert it to a BigNumber before we can do our calculations
  // We do that using the `parseEther` function from ethers.js

  const _addEtherAmountWei = utils.parseEther(_addEther);

  // Ratio needs to be maintained when we add liquidity.
  // We need to let the user know for a specific amount of ether how many `DD` tokens
  // He can add so that the price impact is not large
  // The ratio we follow is (amount of De Dev tokens to be added) / (De Dev tokens balance) = (Eth that would be added) / (Eth reserve in the contract)
  // So by maths we get (amount of De Dev tokens to be added) = (Eth that would be added * De Dev tokens balance) / (Eth reserve in the contract)

  const deDevTokenAmount = _addEtherAmountWei.mul(ddTokenReserve).div(etherBalanceContract);
  return deDevTokenAmount;
};
