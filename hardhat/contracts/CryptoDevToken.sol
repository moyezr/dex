// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    // Price of one Crypto Dev Token
    uint256 public constant tokenPrice = 0.001 ether;
    // Each NFT would give the user 10 tokens
    // It needs to represented as 10 * (10**18) as ERC20 tokens are represented by the smallest denomination possible for the token
    // By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, having a balance of (1)
    // is actually equal to 10^(-18) tokens.abi
    // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places

uint256 public constant tokensPerNFT = 10 * 10**18;
// the max total supply is 10000 for Crypto Dev Tokens
uint256 public constant maxTotalSupply = 10000 * 10**18;

//AiMints contract instance
IAiMints AiMintsNFT;
// Mapping to keep track of which tokenIds have been claimed
mapping(address => bool) public addressesClaimed;

contructor(address _aiMintsContract) ERC20("Crypto Dev Token", "CD") {
    AiMintsNFT = IAiMints(_aiMintsContract);
}

/**
 * @dev Mints `amount` number of CryptoDevTokens
 */

function mint(uint256 amount) public payable {
    uint256 _requiredAmount = tokenPrice * amount;
    require(msg.value >= _requiredAmount, "Ether sent is incorrect");

    uint256 amountWithDecimals = amount * 10**18;
    require(totalSupply() + amountWithDecimals <= maxTotalSupply,
    "Exceeds the max total supply available");

    _mint(msg.sender, amountWithDecimals);
}

/**
 * @dev Mints tokens based on the number of NFT's held by the sender
 */

function claim() public {
    address sender = msg.sender;
    // Get the number of AiMints NFT's held by a given sender address
    uint256 balance = AiMintsNFT.balanceOf(sender);
    require(balance > 0, "You don't own any Ai Mints NFT");

    require(!addressesClaimed[sender], "You have already claimed your tokens");
          _mint(msg.sender, balance * tokensPerNFT);
}

      function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw, contract balance empty");
        
        address _owner = owner();
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
      }

      // Function to receive Ether. msg.data must be empty
      receive() external payable {}

      // Fallback function is called when msg.data is not empty
      fallback() external payable {}

}