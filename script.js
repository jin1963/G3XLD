let web3;
let contract;
let userAccount;
const contractAddress = "0x27d82cc200033d8ecf6b5558ebe60ca212338a4f";

// โหลดเมื่อเปิดหน้าเว็บ
window.addEventListener("load", async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      userAccount = accounts[0];
      contract = new web3.eth.Contract(stakingABI, contractAddress);
      document.getElementById("walletInfo").innerText = "✅ Connected: " + userAccount;
    } catch (err) {
      console.error("Wallet connect error", err);
    }
  } else {
    alert("⚠️ Please install MetaMask.");
  }
});

// ปุ่ม Stake
document.getElementById("stakeBtn").addEventListener("click", async () => {
  const amount = document.getElementById("stakeAmount").value;
  const tier = parseInt(document.getElementById("tierSelect").value);

  if (!amount || isNaN(amount) || amount <= 0) {
    alert("❌ Enter valid G3X amount.");
    return;
  }

  try {
    const stakeAmount = web3.utils.toWei(amount, "ether");
    const tokenAddress = await contract.methods.token().call();

    const tokenContract = new web3.eth.Contract([
      {
        "constant": false,
        "inputs": [
          { "name": "_spender", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
      }
    ], tokenAddress);

    // อนุมัติ Token
    await tokenContract.methods.approve(contractAddress, stakeAmount).send({ from: userAccount });

    // Stake
    await contract.methods.stake(stakeAmount, tier).send({ from: userAccount });

    document.getElementById("status").innerText = `✅ Staked ${amount} G3X for ${tier} days`;
  } catch (err) {
    console.error("Stake failed:", err);
    alert("❌ Stake failed. See console.");
  }
});

// ปุ่ม Claim
document.getElementById("claimBtn").addEventListener("click", async () => {
  try {
    const stakeCount = await contract.methods.getStakeCount(userAccount).call();
    for (let i = 0; i < stakeCount; i++) {
      await contract.methods.claimRewards(i).send({ from: userAccount });
    }
    document.getElementById("status").innerText = "🎉 Rewards claimed!";
  } catch (err) {
    console.error("Claim failed:", err);
    alert("❌ Claim failed.");
  }
});

// ปุ่ม Unstake
document.getElementById("unstakeBtn").addEventListener("click", async () => {
  try {
    const stakeCount = await contract.methods.getStakeCount(userAccount).call();
    for (let i = 0; i < stakeCount; i++) {
      const info = await contract.methods.getStakeInfo(userAccount, i).call();
      const currentTime = Math.floor(Date.now() / 1000);
      const unlockTime = parseInt(info.startTime) + parseInt(info.tierDays) * 86400;

      if (!info.withdrawn && currentTime >= unlockTime) {
        await contract.methods.unstake(i).send({ from: userAccount });
      }
    }
    document.getElementById("status").innerText = "🔓 Unstake successful!";
  } catch (err) {
    console.error("Unstake failed:", err);
    alert("❌ Unstake failed.");
  }
});
