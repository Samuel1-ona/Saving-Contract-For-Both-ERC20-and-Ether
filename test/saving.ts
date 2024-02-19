import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Saving", function () {
  async function deploySaveERC20() {
    const [owner, account1] = await ethers.getSigners();

    const Cov = await ethers.getContractFactory("Coval");
    const cov = await Cov.deploy();

    const Saving = await ethers.getContractFactory("Saving");
    const saving= await Saving.deploy(cov.target);
   
    return { saving, owner, cov, account1 };
  }

  describe("depositing into the contract", function () {
    it("should check user balance", async function(){
        const { saving, owner} = await loadFixture(deploySaveERC20);

        // Check user balance
        const [etherBalance, erc20Balance] = await saving.checkUserBalance(owner.address);

        // Expect Ether balance to be zero
        expect(etherBalance).to.equal(0);

        // Expect ERC20 balance to be zero
        expect(erc20Balance).to.equal(0);
    });
    it("should check user ether balance", async function(){
        const { saving, owner } = await loadFixture(deploySaveERC20);
    
        // Check user Ether balance
        const etherBalance = await saving.checkUserEtherBalance(owner.address);
    
        // Expect Ether balance to be zero initially
        expect(etherBalance).to.equal(0);
    });
    
    it("should check user erc20 balance", async function(){
        const { saving, owner } = await loadFixture(deploySaveERC20);
    
        // Check user Ether balance
        const erc20Balance = await saving.checkUserERC20Balance(owner.address);
    
        // Expect Ether balance to be zero initially
        expect(erc20Balance).to.equal(0);
    });

    it("should check contract balance", async function(){
        const { saving } = await loadFixture(deploySaveERC20);
    
        // Check contract balances
        const [etherBalance, erc20Balance] = await saving.checkContractBalance();
    
        // Expect Ether balance of the contract to be zero initially
        expect(etherBalance).to.equal(0);
    
        // Expect ERC20 balance of the contract to be zero initially
        expect(erc20Balance).to.equal(0);
    });
    it("should check if the eth has been deposited  balance", async function(){
        const { saving, owner } = await loadFixture(deploySaveERC20);
    
        // Deposit Ether into the contract
        await saving.connect(owner).depositEther({ value: ethers.parseEther("1") });
    
        // Check contract Ether balance
        const etherBalance = await saving.checkContractBalance();
    
        // Expect contract Ether balance to be equal to the deposited amount
        expect(etherBalance[0]).to.equal(ethers.parseEther("1"));
    });

    it("should deposit ERC20 into the contract", async function () {
        const { saving, owner, account1, cov } = await loadFixture(deploySaveERC20);
    
        const amountToDeposit = ethers.parseEther("1");
    
        // Assuming 'cov' is the ERC20 token instance and 'saving' is the contract instance where tokens are being deposited.
        // The owner (or the initial holder of 'cov' tokens) approves 'saving' contract to spend on their behalf.
        await cov.connect(owner).approve(saving.target, amountToDeposit);
    
        // Assuming 'owner' transfers some 'cov' tokens to 'account1' for them to deposit.
        // This step is necessary if 'account1' needs to have some 'cov' tokens before depositing to 'saving'.
        await cov.connect(owner).transfer(account1.address, amountToDeposit);
    
        // Now, 'account1' approves the 'saving' contract to spend their tokens before depositing.
        await cov.connect(account1).approve(saving.target, amountToDeposit);
    
        // 'account1' deposits the ERC20 tokens into the 'saving' contract.
        await saving.connect(account1).depositERC20(amountToDeposit);
    
        // Check the updated token balance inside the 'saving' contract for 'account1'.
        const tokenBalance = await saving.checkUserERC20Balance(account1.address);
    
        // Assuming 'checkUserERC20Balance' returns the balance of 'cov' tokens for 'account1' within the 'saving' contract.
        expect(tokenBalance).to.equal(amountToDeposit);
    });

    it("should revert with error 'can't save zero value'", async function () {
        const { saving, account1 } = await loadFixture(deploySaveERC20);
    
        const amountToDeposit = ethers.parseEther("0");
    
        // Attempt to deposit 0 and expect it to revert
        await expect(saving.connect(account1).depositERC20(amountToDeposit))
            .to.be.revertedWith("can't save zero value");
    });
    
    it("should revert with error 'not enough token'", async function () {
        const { saving, account1, cov } = await loadFixture(deploySaveERC20);
    
        // Set an amount to deposit that is greater than what account1 will have.
        const amountToDeposit = ethers.parseEther("1");
    
        // Ensure account1 has less than the amount to deposit, for this example let's ensure it's 0.
        // This step assumes account1 initially has no tokens or you have a way to reset their balance.
        // If account1 might already have tokens, consider transferring them away or use a different account with a guaranteed 0 balance.
    
        // Approve the 'saving' contract to spend tokens on behalf of 'account1'.
        // This step is technically unnecessary for the test to pass since the failure is expected due to balance, not lack of approval.
        // However, including it for completeness or future test adjustments.
        await cov.connect(account1).approve(saving.target, amountToDeposit);
    
        // Attempt to deposit and expect it to revert due to insufficient balance.
        await expect(saving.connect(account1).depositERC20(amountToDeposit))
            .to.be.revertedWith("not enough token");
    });

    it("should be able to withdraw", async function() {
        const { saving, owner, account1, cov } = await loadFixture(deploySaveERC20);
    
        const amountToDeposit = ethers.parseEther("1");
    
        // Transfer tokens to account1 to deposit.
        await cov.connect(owner).transfer(account1.address, amountToDeposit);
    
        // Account1 approves the saving contract to spend their tokens.
        await cov.connect(account1).approve(saving.target, amountToDeposit);
    
        // Account1 deposits the tokens into the saving contract.
        await saving.connect(account1).depositERC20(amountToDeposit);
    
        // Before withdrawal, check balance to ensure deposit was successful.
        const tokenBalanceBeforeWithdrawal = await cov.balanceOf(account1.address);
        console.log("Balance before withdrawal:", ethers.formatEther(tokenBalanceBeforeWithdrawal));
    
        // Account1 withdraws the tokens back.
        await saving.connect(account1).withdrawERC20(amountToDeposit);
    
        // Check the final token balance of account1 in the ERC20 contract to ensure withdrawal.
        const finalTokenBalance = await cov.balanceOf(account1.address);
    
        // Assuming the initial balance of account1 was 0 before the test, it should now be back to amountToDeposit after withdrawal.
        expect(finalTokenBalance).to.equal(amountToDeposit);
    });
    it("should not withdraw zero amount", async function (){
        const { saving, account1 } = await loadFixture(deploySaveERC20);
    
        const amountToWithdraw = ethers.parseEther("0");
    
        // Attempt to withdraw 0 and expect it to revert
        await expect(saving.connect(account1).withdrawERC20(amountToWithdraw))
        .to.be.revertedWith("can't withdraw zero value");
    })
    
    it("should check if the eth can be withdrawn", async function(){
        const { saving, owner } = await loadFixture(deploySaveERC20);
    
        // Deposit Ether into the contract
        const depositAmount = ethers.parseEther("1");
        await saving.connect(owner).depositEther({ value: depositAmount });
    
        // Get contract balance after deposit to ensure the deposit was successful
        const contractBalanceAfterDeposit = await ethers.provider.getBalance(saving.target);
        expect(contractBalanceAfterDeposit).to.equal(depositAmount);
    
        // Simulate withdrawing Ether to capture the transaction cost
        const tx = await saving.connect(owner).withdrawEther();

    
        // Ensure the contract's Ether balance is 0 after withdrawal
        const contractBalanceAfterWithdrawal = await ethers.provider.getBalance(saving.target);
        expect(contractBalanceAfterWithdrawal).to.equal(0);
    });
    
    
});
});
