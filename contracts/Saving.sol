// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC20.sol";

contract Saving {
    address owner;
    address savingToken;

    mapping(address => uint256) etherSavings;
    mapping(address => uint256) erc20Savings;

    constructor(address _savingToken) {
        savingToken = _savingToken;
        owner = msg.sender;
    }

    function depositEther() external payable {
        require(msg.value > 0, "can't save zero value");
        etherSavings[msg.sender] += msg.value;
    }
    function depositERC20(uint256 _amount) external {
        require(msg.sender != address(0), "address zero detected");
        require(_amount > 0, "can't save zero value");
        require(IERC20(savingToken).balanceOf(msg.sender) >= _amount, "not enough token");
        require(IERC20(savingToken).transferFrom(msg.sender, address(this), _amount), "failed to transfer");
        erc20Savings[msg.sender] += _amount;
    }

    function withdrawEther() external {
        uint256 _userSavings = etherSavings[msg.sender];
        require(_userSavings > 0, "you don't have any savings");
        etherSavings[msg.sender] -= _userSavings;
        payable(msg.sender).transfer(_userSavings);
    }
    
    function withdrawERC20(uint256 _amount) external {
        require(msg.sender != address(0), "address zero detected");
        require(_amount > 0, "can't withdraw zero value");
        uint256 _userSaving = erc20Savings[msg.sender];
        require(_userSaving >= _amount, "insufficient funds");
        erc20Savings[msg.sender] -= _amount;
        require(IERC20(savingToken).transfer(msg.sender, _amount), "failed to withdraw");
    }
    
    function checkUserBalance(address _user) external view returns (uint256, uint256) {
        return (etherSavings[_user], erc20Savings[_user]);
    }
    
    function checkUserEtherBalance(address _user) external view returns (uint256) {
        return etherSavings[_user];
    }
    
    function checkUserERC20Balance(address _user) external view returns (uint256) {
        return erc20Savings[_user];
    }
    
    function checkContractBalance() external view returns(uint256, uint256) {
        return (address(this).balance, IERC20(savingToken).balanceOf(address(this)));
    }
}








