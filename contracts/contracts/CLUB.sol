// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./MyERC20.sol";
import "./MyERC721.sol";


contract Club {

    uint256 constant public Token_AMOUNT = 100;
    uint256 constant public PUBLISH_AMOUNT = 100;
    uint256 constant public VOTE_AMOUNT = 100;
    int256 constant public Limit_TIME = 5 minutes;
    address public manager; // 管理员
    // the type of proposal
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
    // the Voter
    struct Voter {
        uint weight; // The weight of the vote count
        address delegate; // delegate
        uint agree_reject;
        bool[] proposal_voted;
    }
    address[] public players; // 玩家
    MyERC20 public myERC20; // 彩票相关的代币合约
    MyERC721 public myERC721; // 奖励NFT代币合约
    Proposal public proposal;
    Proposal[] public proposals;
    uint constant public TimeLimit = 500;
    uint lastUpdated;
    uint256 public q;
    // Create one Voter for each possible address
    mapping(address => Voter) public voters;
    mapping(address => uint256) public proposer;
    modifier onlyManager {
        require(msg.sender == manager);
        _;
    }
    // 管理员
    constructor() {
        myERC20 = new MyERC20("ZJUToken", "ZJUTokenSymbol");
        manager = msg.sender;
        myERC721 = new MyERC721();
    }

    // 获取参与者数量
    function getPlayerNumber() view external returns (uint256){
        return players.length;
    }
    // 获取目前提案的数量
    function getProposalNumber() view external returns (uint256){
        return proposals.length;
    }
    // 获取目前提案需要查询的提案
    function getProposalAll(uint index) external{
        refresh();
        proposal = proposals[index];
    }
    // 获取目前提案人的通过提案和总提案数
    function getProposer() external {
        q = proposer[msg.sender];
    }
    // 加入投票提案圈
    function join() external {
        players.push(msg.sender);
        proposer[msg.sender] = 0;
        for (uint i = 0; i < proposals.length; i++) {
            voters[msg.sender].proposal_voted.push(false);
        }
    }
    // 提案初始化
    function ProposalInitial(string memory _name, string memory _content) internal {
        proposal = Proposal({
        name: _name,
        content: _content,
        approve: 0,
        reject: 0,
        closed: false,
        start: block.timestamp,
        remaintime: Limit_TIME,
        publish: false,
        proposer_in: msg.sender,
        get_credit: false
        });
    }
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
        refresh();
    }

    // 参与投票, index表示提案的编号
    function voteToProposal(uint index, uint k) public {
        // 投票操作
        myERC20.transferFrom(msg.sender, address(this), VOTE_AMOUNT);
        require(index < proposals.length, "Your proposal is not available");
        vote(k, index);
        refresh();
    }

    // 刷新页面，当提案通过时，返回一定数量的积分
    function refresh() public {
        // require(proposals.length > 0, "Don't have any proposals");
        for (uint256 i = 0; i < proposals.length; i++) {
            getProposal(i);
            if (proposals[i].publish && !proposals[i].get_credit) {
                proposals[i].get_credit = true;
                myERC20.get_credit(proposals[i].proposer_in);
            }
        }
    }

    function givePermissionToVote(address voter) internal {
        voters[voter].weight = 1;
        voters[voter].proposal_voted.push(false);
    }

    // 把你的投票委托到投票者 `to`。
    function delegate(address to, uint index) public {
        Voter storage sender = voters[msg.sender];
        require(!sender.proposal_voted[index], "You already voted.");

        require(to != msg.sender, "Self-delegation is disallowed.");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;

            // 不允许闭环委托
            require(to != msg.sender, "Found loop in delegation.");
        }

        sender.proposal_voted[index] = true;
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
        // refresh();
    }

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

    // 计算该提案离投票结束的时间
    function remainMinutes(uint index) internal {
        if (proposals[index].remaintime <= 0) {
            proposals[index].remaintime = 0;
        }
        else {
            proposals[index].remaintime = Limit_TIME - int256(block.timestamp - proposals[index].start);
        }
        if (proposals[index].remaintime <= 0) {
            proposals[index].remaintime = 0;
        }
    }

    // 提取提案，对其进行下列操作
    function getProposal(uint index) public {
        remainMinutes(index);
        judgePublish(index);
    }

    // 领取纪念品奖励
    function getBonus() public returns(uint256) {
        uint256 Id = 0;
        require(proposer[msg.sender]>=3, "You don't have published more than three proposals.");
        Id = myERC721.awardItem(msg.sender, "https://image.baidu.com/search/detail?ct=503316480&z=0&ipn=d&word=%E7%81%AB%E7%AE%AD&hs=0&pn=1&spn=0&di=46137345&pi=0&rn=1&tn=baiduimagedetail&is=0%2C0&ie=utf-8&oe=utf-8&cl=2&lm=-1&cs=1302870051%2C2664585126&os=3090855258%2C1085595665&simid=4234681352%2C588286236&adpicid=0&lpn=0&ln=30&fr=ala&fm=&sme=&cg=&bdtype=11&oriquery=%E7%81%AB%E7%AE%AD&objurl=https%3A%2F%2Fpics3.baidu.com%2Ffeed%2F08f790529822720e066b12283f5e264df01fabdf.png%40f_auto%3Ftoken%3D19b5e9bcf33e8588c592bf39a2b4cff3&fromurl=ippr_z2C%24qAzdH3FAzdH3Fkwt3twiw5_z%26e3Bkwt17_z%26e3Bv54AzdH3Ff%3Ft1%3D8090lnmb8c0lnadlmcb%26ou6%3Dfrt1j6%26u56%3Drv&gsm=&islist=&querylist=&dyTabStr=MCwxLDMsNiwyLDQsNSw4LDcsOQ%3D%3D");
        proposer[msg.sender] -= 3;
        return Id;
    }

}
