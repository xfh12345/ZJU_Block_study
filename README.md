# ZJU_Block_study
 区块链投票网址制作
## 功能与实现分析
### 功能简介
1. 学生登陆网站，注册后领取通证积分（浙大币）  
2. 使用100浙大币可以发起提案   
3. 提案在发起规定时间（默认5min）内，所有网站注册人员可使用100浙大币对提案进行投票（反对/赞成），且每人仅有一次投票机会。此外，任何人都可以选择将自己对某一提案的投票权委托给他人。   
4. 时间截止后，赞成数大于反对数，则提案通过，提案者可以自动获取500浙大币作为奖励。  
5. 当发布的提案累计通过3个时，有机会领取社团网站颁发的纪念品，每一个纪念品对应相应的ID，每一个ID对应了一张图片作为奖励。
### 合约代码分析
1. 数据结构   
```
uint256 constant public PUBLISH_AMOUNT = 100; // 发布提案的浙大币
uint256 constant public VOTE_AMOUNT = 100; // 投票的浙大币
int256 constant public Limit_TIME = 5 minutes; // 默认时间
address[] public players; // 注册人员列表
MyERC20 public myERC20; // 彩票相关的代币合约
MyERC721 public myERC721; // 奖励NFT代币合约
Proposal[] public proposals; // 所有发布提案储存区域
mapping(address => Voter) public voters; // 投票人地址映射为Voter型
mapping(address => uint256) public proposer; // 投票人地址对应的通过提案数
```
	提案结构
```
struct Proposal {
    string name;   // 提案的名字
    string content; // 提案的内容
    uint approve; // 赞成的票数
    uint reject; // 反对的票数
    bool closed; // 投票是否关闭
    uint start; // 提案发布时间
    int256 remaintime; // 提案剩余时间
    bool publish; // 是否发布
    address proposer_in; // 发布者的名字
    bool get_credit; // 成功发布后是否已获得奖励
}
```
	投票人结构
```
struct Voter {
    uint weight; // The weight of the vote count
    address delegate; // delegate
    uint agree_reject;
    bool[] proposal_voted;
}
```
2. 注册与领取浙大币
```
// 加入投票提案圈
function join() external {
    players.push(msg.sender);
    proposer[msg.sender] = 0;
    for (uint i = 0; i < proposals.length; i++) {
        voters[msg.sender].proposal_voted.push(false);
    }
}
```
```
// 领取浙大币，每人一定时间内只能领取两次
function airdrop() external {
    require(claimedAirdropPlayerList[msg.sender] == false, "This user has claimed all airdrops already");
    _mint(msg.sender, 1000);
    count[msg.sender] = count[msg.sender] + 1;
    if (count[msg.sender] >= 2){
        claimedAirdropPlayerList[msg.sender] = true;
    }
}
```
3. 发起提案
```
// 发布提案
function publishProposal(string memory _name, string memory _content) public {
    // 委托转账操作
    myERC20.transferFrom(msg.sender, address(this), PUBLISH_AMOUNT);
    // 把参与者加入到彩票池中
    ProposalInitial(_name, _content);
    // 给所有人员提供投票权
    for (uint256 i = 0; i < players.length; i++){
        givePermissionToVote(players[i]);
    }
    // 把提案加入到提案数组中
    proposals.push(proposal);
    refresh(); // 刷新相关参数
}
```
4. 投票与委托
```
// 给提案投票，k=0表示反对，k=1表示赞成
function vote(uint k, uint index) public {
    Voter storage sender = voters[msg.sender];
    require(sender.weight>0, "You don't have right to vote.");
    require(!sender.proposal_voted[index], "Already voted this proposal.");
    sender.proposal_voted[index] = true;
    sender.agree_reject = k;
    if (k == 1){
        proposals[index].approve += sender.weight;
    }
    else{
        proposals[index].reject += sender.weight;
    }
}

// 参与投票, index表示提案的编号
function voteToProposal(uint index, uint k) public {
    // 投票操作
    myERC20.transferFrom(msg.sender, address(this), VOTE_AMOUNT); // 委托转账操作
    require(index < proposals.length, "Your proposal is not available"); // 验证
    vote(k, index); // 调用相关投票函数
    refresh();
}
```
```
// 把你的投票委托到投票者 to。
function delegate(address to, uint index) public {
    Voter storage sender = voters[msg.sender];
    require(!sender.proposal_voted[index], "You already voted."); // 判断是否已经投票

    require(to != msg.sender, "Self-delegation is disallowed."); // 判断委托人是否为自己

    while (voters[to].delegate != address(0)) {
        to = voters[to].delegate;

        // 不允许闭环委托
        require(to != msg.sender, "Found loop in delegation.");
    }

    sender.proposal_voted[index] = true; // 将自己变成已投票了
    sender.delegate = to;
    Voter storage delegate_ = voters[to];
    if (delegate_.proposal_voted[index]) {
        // 若被委托者已经投过票了，直接增加得票数
        if (delegate_.agree_reject == 1){
            proposal.approve += sender.weight;
        }
        else{
            proposal.reject += sender.weight;
        }
    } else {
        // 若被委托者还没投票，增加委托者的权重, 即授权这个委托者有投票权
        delegate_.weight += sender.weight;
    }
}
```
5. 提案终止与浙大币返还
```
// 判断该提案是否通过
function judgePublish(uint index) internal {
    if (proposals[index].approve > proposals[index].reject && proposals[index].remaintime <= 0 && !proposals[index].publish) {
        proposals[index].closed = true;
        proposals[index].publish = true;
        proposer[proposals[index].proposer_in] += 1;
    }
    else {
        if (proposals[index].remaintime <= 0) {
            proposals[index].closed = true;
        }
    }
}
```
```
// 奖励500浙大币
function get_credit(address a) external {
    _mint(a, 500);
}
```
6. 通过提案计数，与领取奖励
```
// 领取纪念品奖励
function getBonus() public returns(uint256) {
    uint256 Id = 0;
    require(proposer[msg.sender]>=3, "You don't have published more than three proposals.");
    Id = myERC721.awardItem(msg.sender, "https://pixabay.com/zh/photos/germany-bavaria-swiss-francs-7534750/");
    proposer[msg.sender] -= 3; // proposer是映射类型，对应通过的提案数
    return Id;
}
```
```
// 利用ERC721
function awardItem(address player, string memory tokenURI) public returns(uint256){
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();
    _mint(player, newItemId);
    _setTokenURI(newItemId, tokenURI);

    return newItemId;
}
```
## 如何运行项目
1. 在电脑上安装Node，ganache，hardhat。在浏览器中安装MetaMask插件。
2. 将整个程序包下载到本地之后，按照下面操作进行
```
mkdir demo
cd demo
mkdir contracts
cd contracts
npx hardhat // 选择create typescript
```
	将程序包中contracts的内容全部复制到该文件夹下（全部替换）【保留node_modules】
	然后打开ganache软件，将获得的用户地址与url填入hardhat.config.ts
```
npm install @openzeppelin/contracts
npx hardhat compile 
npx hardhat run ./scripts/deploy.ts --network ganache
```
	记录此时获得的三个合约的部署地址
```
cd ..
npx create-react-app front --template typescript
cd front
npm run start
```
	在浏览器中看到网站出现后，说明操作无误，接下来将程序包中front文件夹下的所有内容拷贝到这个文件夹中（全部替换）【保留node_modules】，打开contract-addresses.json文件，将前面的合约地址对应填入。
```
npm install antd
npm install @ant-design/pro-components
npm install -D web3
npm run start
```
	之后在浏览器中就可以进入网页，开始操作
## 关键界面和流程截图
a   
![开始界面](/image/1.png)