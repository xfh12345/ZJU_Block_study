import { PlusCircleFilled,
  SearchOutlined, 
  UserOutlined,} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-layout';
import {ProLayout, PageContainer, ProSettings,} from '@ant-design/pro-layout';
import { Input, Space, Button, Image, message, Card, Dropdown, Menu, Tag } from 'antd';
import {useEffect, useState, useRef } from 'react';
import complexMenu from './complexMenu';
import {
  FooterToolbar,
  ProForm,
  ProFormDigit,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProFormUploadButton,
  ProFormInstance,
} from '@ant-design/pro-components';
import {clubContract, myERC20Contract, myERC721Contract, web3} from "./utils/contracts";
import './App.css'
import lo from "./asset/head.png"
import myhead from "./asset/head1.png"
import proposalhome from "./asset/proposal1.jpeg"



const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
// TODO change according to your configuration
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'
type Proposal = {
  name: string;
  content: string;
  time: number;
  publish: boolean;
  close: boolean;
};
const filterByMenuData = (data: MenuDataItem[], keyWord: string): MenuDataItem[] =>
  data
    .map((item) => {
      if (
        (item.name && item.name.includes(keyWord)) ||
        filterByMenuData(item.children || [], keyWord).length > 0
      ) {
        return {
          ...item,
          children: filterByMenuData(item.children || [], keyWord),
        };
      }

      return undefined;
    })
    .filter((item) => item) as MenuDataItem[];

const loopMenuItem = (menus: any[]): MenuDataItem[] =>
  menus.map(({ icon, routes, ...item }) => ({
    ...item,
    children: routes && loopMenuItem(routes),
  }));

export default () => {
  const [keyWord, setKeyWord] = useState('');
  const [account, setAccount] = useState('')
  const [accountBalance, setAccountBalance] = useState(0)
  const [playerNumber, setPlayerNumber] = useState(0)
  const [publishAmount, setPublishAmount] = useState(0)
  const [voteAmount, setVoteAmount] = useState(0)
  const [tokenAmount, setTokenAmount] = useState(0)
  const [proposalAmount, setProposalAmount] = useState(0)
  const [proposalName, setProposalName] = useState('')
  const [proposalContent, setProposalContent] = useState('')
  const [proposalPublish, setProposalPublish] = useState(false)
  const [proposalTime, setProposalTime] = useState(0)
  const [approve, setApprove] = useState(0)
  const [index, setIndex] = useState(0)
  const [delegateAddress, setDelegateAddress] = useState('')
  const [bonusId, setBonusId] = useState(0)
  const [pathname, setPathname] = useState('/home')
  const [proposalClose, setProposalClose] = useState(false)
  const [proposalApprove, setPrposalApprove] = useState(0)
  const [proposalReject, setPrposalReject] = useState(0)
  const [proposalPublishAmount, setPrposalPublishAmount] = useState(0)
  const [getBonus, setGetBonus] = useState(false)
  const [URL, setURL] = useState("")
  const formRef = useRef<ProFormInstance>();
  useEffect(() => {
    // 初始化检查用户是否已经连接钱包
    // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
    const initCheckAccounts = async () => {
        // @ts-ignore
        const {ethereum} = window;
        if (Boolean(ethereum && ethereum.isMetaMask)) {
            // 尝试获取连接的用户账户
            const accounts = await web3.eth.getAccounts()
            if(accounts && accounts.length) {
                setAccount(accounts[0])
            }
        }
    }

    initCheckAccounts()
}, [])
useEffect(() => {
    const getClubContractInfo = async () => {
        if (clubContract) {
            const pn = await clubContract.methods.getPlayerNumber().call()
            setPlayerNumber(pn)
            const pd = await clubContract.methods.getProposalNumber().call()
            setProposalAmount(pd)
            const pa = await clubContract.methods.PUBLISH_AMOUNT().call()
            setPublishAmount(pa)
            const pb = await clubContract.methods.VOTE_AMOUNT().call()
            setVoteAmount(pb)
            const pc = await clubContract.methods.Token_AMOUNT().call()
            setTokenAmount(pc)
            

        } else {
            alert('Contract not exists.')
        }
    }
    getClubContractInfo()
}, [])

useEffect(() => {
    const getAccountInfo = async () => {
        if (myERC20Contract) {
            const ab = await myERC20Contract.methods.balanceOf(account).call()
            setAccountBalance(ab)
        } else {
            alert('Contract not exists.')
        }
    }

    if(account !== '') {
        getAccountInfo()
    }
}, [account])

const onClaimTokenAirdrop = async () => {
    if(account === '') {
        alert('You have not connected wallet yet.')
        return
    }

    if (myERC20Contract) {
        try {
            await myERC20Contract.methods.airdrop().send({
                from: account
            })
            onRefresh()
            
            alert('You have claimed ZJU Token and joined the game')
        } catch (error: any) {
            alert(error.message)
        }

    } else {
        alert('Contract not exists.')
    }
}

const onjoin = async () => {
  if(account === '') {
      alert('You have not connected wallet yet.')
      return
  }

  if (myERC20Contract) {
      try {
          await clubContract.methods.join().send({
              from: account
          })
          setPathname("/proposal")
          onRefresh()
          alert('你已经成功注册')
      } catch (error: any) {
          alert(error.message)
      }

  } else {
      alert('Contract not exists.')
  }
}


const onPublish = async () => {
    if(account === '') {
        alert('You have not connected wallet yet.')
        return
    }

    if (clubContract && myERC20Contract) {
        try {
            await myERC20Contract.methods.approve(clubContract.options.address, publishAmount).send({
                from: account
            })
            alert(proposalName)
            await clubContract.methods.publishProposal(proposalName, proposalContent).send({
                from: account
            })
            onRefresh()
            alert('您成功发布了提案')
        } catch (error: any) {
            alert(error.message)
        }
    } else {
        alert('Contract not exists.')
    }
}


const onDelegate = async () => {
    if(account === '') {
        alert('You have not connected wallet yet.')
        return
    }

    if (clubContract && myERC20Contract) {
        try {
            await myERC20Contract.methods.approve(clubContract.options.address, voteAmount).send({
                from: account
            })

            await clubContract.methods.delegate(delegateAddress, index).send({
                from: account
            })
            alert('You have delegated your right.')
        } catch (error: any) {
            alert(error.message)
        }
    } else {
        alert('Contract not exists.')
    }
}
const onSearch = async () => {
  if (clubContract && myERC20Contract) {
      try {
          // const pn = await clubContract.methods.getProposalName(index).call()
          // alert(index)
          await clubContract.methods.getProposalAll(index).send({
            from: account
          })
          // alert(index)
          const cn = await clubContract.methods.proposal().call()
          setProposalName(cn.name)
          setProposalContent(cn.content)
          setProposalClose(cn.closed)
          setProposalPublish(cn.publish)
          setProposalTime(cn.remaintime)
          setPrposalApprove(cn.approve)
          setPrposalReject(cn.reject)
          alert('You have searched the proposal.')
      } catch (error: any) {
          alert(error.message)
      }
  } else {
      alert('Contract not exists.')
  }
}

const onRefresh = async () => {
    if (clubContract && myERC20Contract) {
        try {
            // await clubContract.methods.refresh().call()
            const ab = await myERC20Contract.methods.balanceOf(account).call()
            setAccountBalance(ab)
            const pn = await clubContract.methods.getPlayerNumber().call()
            setPlayerNumber(pn)
            const pd = await clubContract.methods.getProposalNumber().call()
            setProposalAmount(pd)
            
            alert('You have refreshed the page.')
        } catch (error: any) {
            alert(error.message)
        }
    } else {
        alert('Contract not exists.')
    }
}
const onRefresh1 = async () => {
  if (clubContract && myERC20Contract) {
      try {
          // await clubContract.methods.refresh().call()
          // await clubContract.methods.refresh().send({
          //   from: account
          // })
          await clubContract.methods.getProposalAll(index).send({
            from: account
          })
          const cn = await clubContract.methods.proposal().call()
          const ab = await myERC20Contract.methods.balanceOf(account).call()
          setAccountBalance(ab)
          setProposalName(cn.name)
          setProposalContent(cn.content)
          setProposalClose(cn.closed)
          setProposalPublish(cn.publish)
          setProposalTime(cn.remaintime)
          setPrposalApprove(cn.approve)
          setPrposalReject(cn.reject)
          alert('You have refreshed the page.')
      } catch (error: any) {
          alert(error.message)
      }
  } else {
      alert('Contract not exists.')
  }
}
const onRefresh2 = async () => {
  if (clubContract && myERC20Contract) {
      try {
          // await clubContract.methods.refresh().call()
          await clubContract.methods.getProposer().send({
            from: account
          })
          const xn = await clubContract.methods.q().call()
          // alert(xn)
          setPrposalPublishAmount(xn)
          // setPrposalPublishAmount(xn)
          // alert('You have refreshed the page.')
      } catch (error: any) {
          alert(error.message)
      }
  } else {
      alert('Contract not exists.')
  }
}

const onApprove = async () => {
    if (clubContract && myERC20Contract) {
        try {
            
            await myERC20Contract.methods.approve(clubContract.options.address, publishAmount).send({
              from: account
            })

            await clubContract.methods.voteToProposal(index, 1).send({
                from: account
            })
            const ab = await myERC20Contract.methods.balanceOf(account).call()
            setAccountBalance(ab)
            const cn = await clubContract.methods.proposal().call()
            setProposalName(cn.name)
            setProposalContent(cn.content)
            setProposalClose(cn.closed)
            setProposalPublish(cn.publish)
            setProposalTime(cn.remaintime)
            setPrposalApprove(cn.approve)
            setPrposalReject(cn.reject)
            alert('You have approved the proposal.')
        } catch (error: any) {
            alert(error.message)
        }
    } else {
        alert('Contract not exists.')
    }
}

const onReject = async () => {
    if (clubContract && myERC20Contract) {
        try {
            await myERC20Contract.methods.approve(clubContract.options.address, publishAmount).send({
              from: account
            })
            const ab = await myERC20Contract.methods.balanceOf(account).call()
            setAccountBalance(ab)
            await clubContract.methods.voteToProposal(index, 0).send({
                from: account
            })
            alert('You have rejected the proposal.')
            const cn = await clubContract.methods.proposal().call()
            setProposalName(cn.name)
            setProposalContent(cn.content)
            setProposalClose(cn.closed)
            setProposalPublish(cn.publish)
            setProposalTime(cn.remaintime)
            setPrposalApprove(cn.approve)
            setPrposalReject(cn.reject)
        } catch (error: any) {
            alert(error.message)
        }
    } else {
        alert('Contract not exists.')
    }
}


const onGetBonus = async () => {
    if (clubContract && myERC20Contract && myERC721Contract) {
        try {
            const pn = await clubContract.methods.getBonus().send({
                from: account
            })
            setBonusId(1)
            setURL("https://pixabay.com/zh/photos/germany-bavaria-swiss-francs-7534750/")
            
        } catch (error: any) {
            alert(error.message)
        }
    } else {
        alert('Contract not exists.')
    }
}

const onClickConnectWallet = async () => {
    // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
    // @ts-ignore
    const {ethereum} = window;
    if (!Boolean(ethereum && ethereum.isMetaMask)) {
        alert('MetaMask is not installed!');
        return
    }

    try {
        // 如果当前小狐狸不在本地链上，切换Metamask到本地测试链
        if (ethereum.chainId !== GanacheTestChainId) {
            const chain = {
                chainId: GanacheTestChainId, // Chain-ID
                chainName: GanacheTestChainName, // Chain-Name
                rpcUrls: [GanacheTestChainRpcUrl], // RPC-URL
            };

            try {
                // 尝试切换到本地网络
                await ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: chain.chainId}]})
            } catch (switchError: any) {
                // 如果本地网络没有添加到Metamask中，添加该网络
                if (switchError.code === 4902) {
                    await ethereum.request({ method: 'wallet_addEthereumChain', params: [chain]
                    });
                }
            }
        }

        // 小狐狸成功切换网络了，接下来让小狐狸请求用户的授权
        await ethereum.request({method: 'eth_requestAccounts'});
        // 获取小狐狸拿到的授权用户列表
        const accounts = await ethereum.request({method: 'eth_accounts'});
        // 如果用户存在，展示其account，否则显示错误信息
        setAccount(accounts[0] || 'Not able to get accounts');
    } catch (error: any) {
        alert(error.message)
    }
}


switch (pathname) {
  case '/home':
    return (
      <div
        style={{
          height: '100vh',
        }}
      >
        <ProLayout
          location={{
            pathname,
          }}
          title="浙江大学社团提案网站"
          logo="https://avatars1.githubusercontent.com/u/8186664?s=460&v=4"
          menu={{
            hideMenuWhenCollapsed: true,
          }}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/home');
              }}
            >
              {dom}
            </div>
          )}
          menuExtraRender={({ collapsed }) =>
            !collapsed && (
              <Space
                style={{
                  marginBlockStart: 16,
                }}
                align="center"
              >
                <Input
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }}
                  prefix={
                    <SearchOutlined
                      style={{
                        color: 'rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  }
                  placeholder="搜索方案"
                  bordered={false}
                  onPressEnter={(e) => {
                    setKeyWord((e.target as HTMLInputElement).value);
                  }}
                />
                <PlusCircleFilled
                  style={{
                    color: 'var(--ant-primary-color)',
                    fontSize: 24,
                  }}
                />
              </Space>
            )
          }
          menuDataRender={() => loopMenuItem(complexMenu)}
          postMenuData={(menus) => {
            console.log(menus);
            return filterByMenuData(menus || [], keyWord);
          }}
        >
          
          <PageContainer content="" >
          <div className='mytitle'>
            <Image
                    width='100%'
                    height='350px'
                    preview={false}
                    src={myhead}
                />
          </div>
            <div className='mytitle'>
                <h1>欢迎来到浙江大学社团提案网站</h1>
            </div>
            <div className='textcontent'>
                <div>浙江大学学生社团联合会即是浙江大学所有学生社团的管理和监督机构，同时也是所有社团的忠实的代表，在做好各项管理和监督工作同时，
                  为浙江大学的学生社团的发展做不懈的努力，具体职能如下：</div>
                <div>1、在浙江大学党委的领导下,在共青团浙江委员会的具体指导下,负责制定浙江大学学生社团各项管理制度和方针政策。</div>
                <div>2、负责学生社团的成立、注册、变更、注销以及相关的登记和备案和学生社团星级评定和各项评奖评优工作。</div>
                <div>3、负责社团日常活动的审批与备案及社团专项活动经费的管理和对学生社团和社团干部的日常培训、考核和监督。</div>
                <div>4、负责对社团财务管理的监督与审查和对学生社团违规等问题进行监督、检查和处理</div>
                <div>5、积极与校外各部门单位联系,为学生社团的发展创造良好的外部环境,争取更多的社会支持。</div>
                <br />
                <div>本网站仅用于个人对相关内容测试，与浙江大学社团联合会无合作关系，仅在此对背景进行介绍</div>
                <div>请不要在此网站上传任何与社团提案无关的内容，包括但不限于政治敏感话题、有损他人名义的话题。</div>
            </div>
            <div className='buttons'>
            <Button style={{width: '250px'}} onClick={() => {
                setPathname('/home/overview');
              }}>我已阅读相关注意事项，同意进入网站</Button>
            </div>
          </PageContainer>
        </ProLayout>
        
      </div>
    );
    break;
  case '/home/overview':
    return (
      <div
        style={{
          height: '100vh',
        }}
      >
        <ProLayout
          location={{
            pathname,
          }}
          title="浙江大学社团提案"
          logo="https://avatars1.githubusercontent.com/u/8186664?s=460&v=4"
          menu={{
            hideMenuWhenCollapsed: true,
          }}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/home');
              }}
            >
              {dom}
            </div>
          )}
          menuExtraRender={({ collapsed }) =>
            !collapsed && (
              <Space
                style={{
                  marginBlockStart: 16,
                }}
                align="center"
              >
                <Input
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }}
                  prefix={
                    <SearchOutlined
                      style={{
                        color: 'rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  }
                  placeholder="搜索方案"
                  bordered={false}
                  onPressEnter={(e) => {
                    setKeyWord((e.target as HTMLInputElement).value);
                  }}
                />
                <PlusCircleFilled
                  style={{
                    color: 'var(--ant-primary-color)',
                    fontSize: 24,
                  }}
                />
              </Space>
            )
          }
          menuDataRender={() => loopMenuItem(complexMenu)}
          postMenuData={(menus) => {
            console.log(menus);
            return filterByMenuData(menus || [], keyWord);
          }}
        >
          
          <PageContainer content="" >
          <Image
                  width='100%'
                  height='250px'
                  preview={false}
                  src={lo}
              />
            <div className='main'>
                <h1>浙江大学社团提案网站注册界面</h1>
            </div>
            <div className='main'>
                  {account === '' && <Button style={{width: '250px'}} onClick={onClickConnectWallet}>请先登录登陆以太坊账户</Button>}
                  <div>当前用户：{account === '' ? '无用户连接' : account}</div>
                  <div>
                      <UserOutlined /> 目前网页共有{playerNumber}人/次参加
                  </div>    
            </div>
            <div className='operation'>
                <Input size="large" placeholder='姓名' prefix={<UserOutlined />} />
                <br />
                <Input placeholder='学号' prefix={<UserOutlined />}/>
                <br />
                <Input placeholder='性别' prefix={<UserOutlined />}/>
                <br />
                <Input placeholder='所属社团' prefix={<UserOutlined />}/>
                <br />
                <Button onClick={onjoin}>注册</Button>
            </div>
          </PageContainer>
        </ProLayout>
        
      </div>
    );
  case '/proposal/publish':
    return (
      <div
        style={{
          height: '100vh',
        }}
      >
        <ProLayout
          location={{
            pathname,
          }}
          title="浙江大学社团提案"
          logo="https://avatars1.githubusercontent.com/u/8186664?s=460&v=4"
          menu={{
            hideMenuWhenCollapsed: true,
          }}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/proposal');
              }}
            >
              {dom}
            </div>
          )}
          menuExtraRender={({ collapsed }) =>
            !collapsed && (
              <Space
                style={{
                  marginBlockStart: 16,
                }}
                align="center"
              >
                <Input
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }}
                  prefix={
                    <SearchOutlined
                      style={{
                        color: 'rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  }
                  placeholder="搜索方案"
                  bordered={false}
                  onPressEnter={(e) => {
                    setKeyWord((e.target as HTMLInputElement).value);
                  }}
                />
                <PlusCircleFilled
                  style={{
                    color: 'var(--ant-primary-color)',
                    fontSize: 24,
                  }}
                />
              </Space>
            )
          }
          menuDataRender={() => loopMenuItem(complexMenu)}
          postMenuData={(menus) => {
            console.log(menus);
            return filterByMenuData(menus || [], keyWord);
          }}
        >
          
          <PageContainer content="" >
            <div className='main'>
                <h1>发布提案</h1>
            </div>
            <div className='main'>
                  {account === '' && <Button style={{width: '300px'}} onClick={onClickConnectWallet}>请先登录登陆以太坊账户</Button>}
                  <div>当前用户：{account === '' ? '无用户连接' : account}</div>
                  <div>
                      <UserOutlined /> 目前网页共有{playerNumber}人/次参加
                  </div>    
            </div>
            <div className='operation'>
                <Button style={{width: '250px'}} onClick={onClaimTokenAirdrop}>领取2000浙大币(一周仅可领取两次)</Button>
            </div>
            <div className='account'>
                {account === '' && <Button onClick={onClickConnectWallet}>连接钱包</Button>}
                <div>当前用户拥有浙大币数量：{account === '' ? 1 : accountBalance}</div>
                <Button style={{width: '100px'}} onClick={onRefresh}>刷新</Button>
            </div>
            <Card>
          <ProForm
            formRef={formRef}
            submitter={{
              searchConfig: {
                resetText: '重置',
                submitText: '保存',
              },
              render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>,
            }}
            onFinish={async (values) => {
              setProposalName(formRef?.current?.getFieldValue('name'))
              setProposalContent(formRef?.current?.getFieldValue('content'))
              // setProposalTime(formRef?.current?.getFieldValue('proposalTime'))
              console.log(values);
              alert("以保存，确定后请按提交键")
              return true;
            }}
          >
              <ProFormText
                name="name"
                label="提案名称"
                tooltip="最长为 24 位"
                placeholder="请输入名称"
              />
              <ProFormTextArea
                width="xl"
                name="content"
                label="提案内容名称"
                placeholder="请输入内容"
              />
              <ProFormDigit name={['contract', 'createTime']} label="提案持续时间（min）"/>
            <ProFormRadio.Group
                label="发布时间"
                name="proposalTime"
                initialValue="立即"
                options={['立即', '1日后', '1周后']}
              />
            <ProFormUploadButton
              extra="支持扩展名：.jpg .zip .doc .wps"
              label="提案相关附件"
              name="file"
              title="上传文件"
            />
            <div className='buttons'>
              <Button style={{width: '100px'}} onClick={onPublish}>确认提交</Button>
            </div>
            
          </ProForm>
        </Card>
          </PageContainer>
        </ProLayout>
        
      </div>
    );
    break;
  case '/proposal/vote':
    return(
      <ProLayout
          location={{
            pathname,
          }}
          title="浙江大学社团提案"
          logo="https://avatars1.githubusercontent.com/u/8186664?s=460&v=4"
          menu={{
            hideMenuWhenCollapsed: true,
          }}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/proposal');
              }}
            >
              {dom}
            </div>
          )}
          menuExtraRender={({ collapsed }) =>
            !collapsed && (
              <Space
                style={{
                  marginBlockStart: 16,
                }}
                align="center"
              >
                <Input
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }}
                  prefix={
                    <SearchOutlined
                      style={{
                        color: 'rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  }
                  placeholder="搜索方案"
                  bordered={false}
                  onPressEnter={(e) => {
                    setKeyWord((e.target as HTMLInputElement).value);
                  }}
                />
                <PlusCircleFilled
                  style={{
                    color: 'var(--ant-primary-color)',
                    fontSize: 24,
                  }}
                />
              </Space>
            )
          }
          menuDataRender={() => loopMenuItem(complexMenu)}
          postMenuData={(menus) => {
            console.log(menus);
            return filterByMenuData(menus || [], keyWord);
          }}
        >
      
        <div className='proposal'>
        <div>当前用户：{account === '' ? '无用户连接' : account}</div>
        <div>当前用户拥有浙大币数量：{account === '' ? 1 : accountBalance}</div>
            <UserOutlined /> 当前已有{proposalAmount}提案
            <div>当前提案名称：{proposalName===''?"请选择提案":proposalName}</div>
            <div>当前提案内容：{proposalContent}</div>
            <div>当前提案状态：{proposalClose === false ? (proposalName === '' ? "": '开启') : "关闭"}</div>
            <div>当前提案剩余时间：{proposalName === ''?"":proposalTime}</div>
            <div>当前提案是否通过：{proposalPublish === false ? (proposalName === '' ? "": '未通过') : "通过"}</div>
            <div>当前提案赞成票数：{proposalName === ""?"":proposalApprove}</div>
            <div>当前提案反对票数：{proposalName === ""?"":proposalReject}</div>

        </div>
        <div>请选择您想要投票的提案或者想要查询的提案</div>
        <div>
            <div>提案序号</div>
            <input type= "number" onChange={(e) => setIndex(e.target.valueAsNumber)}/>
            <Button style={{width: '200px'}} onClick={onSearch}>查询</Button>
        </div>
        <div className='buttons'>
          <Button style={{width: '200px'}} onClick={onApprove}>赞成</Button>
          <Button style={{width: '200px'}} onClick={onReject}>反对</Button>
        </div>
          <br/>
        <div>如果您想要将自己的投票权委托他人，请填写下面两行</div>
        <div>
            
            <div>被委托人地址</div>
            <input type= "text" onChange={(e) => setDelegateAddress(e.target.value)}/>
            <br />
            <Button style={{width: '200px'}} onClick={onDelegate}>委托他人投票</Button>
        </div>
        <div>
          <Button style={{width: '200px'}} onClick={onRefresh1}>刷新界面</Button>
        </div>
        </ProLayout>
    );
    break;
  case '/proposal':
    return (
      <div
        style={{
          height: '100vh',
        }}
      >
        <ProLayout
          location={{
            pathname,
          }}
          title="浙江大学社团提案"
          logo="https://avatars1.githubusercontent.com/u/8186664?s=460&v=4"
          menu={{
            hideMenuWhenCollapsed: true,
          }}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/home');
              }}
            >
              {dom}
            </div>
          )}
          menuExtraRender={({ collapsed }) =>
            !collapsed && (
              <Space
                style={{
                  marginBlockStart: 16,
                }}
                align="center"
              >
                <Input
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }}
                  prefix={
                    <SearchOutlined
                      style={{
                        color: 'rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  }
                  placeholder="搜索方案"
                  bordered={false}
                  onPressEnter={(e) => {
                    setKeyWord((e.target as HTMLInputElement).value);
                  }}
                />
                <PlusCircleFilled
                  style={{
                    color: 'var(--ant-primary-color)',
                    fontSize: 24,
                  }}
                />
              </Space>
            )
          }
          menuDataRender={() => loopMenuItem(complexMenu)}
          postMenuData={(menus) => {
            console.log(menus);
            return filterByMenuData(menus || [], keyWord);
          }}
        >
          
          <PageContainer content="" >
          <Image
                  width='100%'
                  height='250px'
                  preview={false}
                  src={proposalhome}
              />
            <div className='main'>
                <h1>提案发布与投票</h1>
            </div>
            <div>在这里我们可以为我们的社团书写每一个不同的故事</div>
            <div>在发布相关内容或投票之前，前线阅读如下内容：</div>
            <br />
            <div>1.请仔细检查所需要发布的提案，发布之后将无法更改。</div>
            <div>2.每发布一次提案，将要消耗100浙大币，如果提案通过将返还500浙大币。</div>
            <div>3.成功发布提案并通过三次以上，将有机会获得社团发放的虚拟纪念品（每次活动期间仅能兑换一次）。</div>
            <div>4.您可以查看任何已发布的提案内容，并对相关提案进行投票，且每次将要消耗100浙大币。</div>
            <div>5.请注意，您只能对您注册网站之后发布的提案进行投票，此举是为了防止后期刷票，导致提案之间恶性竞争。</div>
            <div>6.在您未对某一提案进行投票时，您可以选择将自己的投票权授予他人代您投票，这将消耗100浙大币。</div>

            <div className='buttons'>
              <Button style={{width: '200px'}} onClick={() => {
                  setPathname("/proposal/publish");
                }}>发布提案</Button>
              <Button style={{width: '200px'}} onClick={() => {
                  setPathname("/proposal/vote");
                }}>为提案投票</Button>
            </div>
          </PageContainer>
        </ProLayout>
        
      </div>
    );
    break;
  case '/bonus/imformation':
    return (
      <div
        style={{
          height: '100vh',
        }}
      >
        <ProLayout
          location={{
            pathname,
          }}
          title="浙江大学社团提案"
          logo="https://avatars1.githubusercontent.com/u/8186664?s=460&v=4"
          menu={{
            hideMenuWhenCollapsed: true,
          }}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/home');
              }}
            >
              {dom}
            </div>
          )}
          menuExtraRender={({ collapsed }) =>
            !collapsed && (
              <Space
                style={{
                  marginBlockStart: 16,
                }}
                align="center"
              >
                <Input
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }}
                  prefix={
                    <SearchOutlined
                      style={{
                        color: 'rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  }
                  placeholder="搜索方案"
                  bordered={false}
                  onPressEnter={(e) => {
                    setKeyWord((e.target as HTMLInputElement).value);
                  }}
                />
                <PlusCircleFilled
                  style={{
                    color: 'var(--ant-primary-color)',
                    fontSize: 24,
                  }}
                />
              </Space>
            )
          }
          menuDataRender={() => loopMenuItem(complexMenu)}
          postMenuData={(menus) => {
            console.log(menus);
            return filterByMenuData(menus || [], keyWord);
          }}
        >
          
          <PageContainer content="" >
          <Image
                  width='100%'
                  height='150px'
                  preview={false}
                  src={lo}
              />
            <div className='main'>
                  {account === '' && <Button style={{width: '250px'}} onClick={onClickConnectWallet}>请先登录登陆以太坊账户</Button>}
                  <div>当前用户：{account === '' ? '无用户连接' : account}</div>
                  <div>当前用户拥有浙大币数量：{account === '' ? 1 : accountBalance}</div>
                  <div>当前通过提案数：{account === '' ? '无用户连接' : proposalPublishAmount}</div>
                  <div>是否兑换奖励：{getBonus === false ?'否':'是'}</div>
                  <div>奖励ID：{bonusId}</div>
                  <div>该ID对应图片：{URL}</div>
                  <Button style={{width: '100px'}} onClick={onGetBonus}>领取Bonus</Button>
                  <Button style={{width: '100px'}} onClick={onRefresh2}>刷新界面</Button>
            </div>
            
          </PageContainer>
        </ProLayout>
        
      </div>
    );
  default:
    return (
      <div
        style={{
          height: '100vh',
        }}
      >
        <ProLayout
          location={{
            pathname,
          }}
          title="浙江大学社团提案"
          logo="https://avatars1.githubusercontent.com/u/8186664?s=460&v=4"
          menu={{
            hideMenuWhenCollapsed: true,
          }}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                setPathname(item.path || '/home');
              }}
            >
              {dom}
            </div>
          )}
          menuExtraRender={({ collapsed }) =>
            !collapsed && (
              <Space
                style={{
                  marginBlockStart: 16,
                }}
                align="center"
              >
                <Input
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                  }}
                  prefix={
                    <SearchOutlined
                      style={{
                        color: 'rgba(0, 0, 0, 0.15)',
                      }}
                    />
                  }
                  placeholder="搜索方案"
                  bordered={false}
                  onPressEnter={(e) => {
                    setKeyWord((e.target as HTMLInputElement).value);
                  }}
                />
                <PlusCircleFilled
                  style={{
                    color: 'var(--ant-primary-color)',
                    fontSize: 24,
                  }}
                />
              </Space>
            )
          }
          menuDataRender={() => loopMenuItem(complexMenu)}
          postMenuData={(menus) => {
            console.log(menus);
            return filterByMenuData(menus || [], keyWord);
          }}
        >
          
          <PageContainer content="" >
          <Image
                  width='100%'
                  height='150px'
                  preview={false}
                  src={lo}
              />
            <div className='main'>
                <h1>浙江大学社团提案网站注册界面</h1>
            </div>
            <div className='main'>
                  {account === '' && <Button style={{width: '250px'}} onClick={onClickConnectWallet}>请先登录登陆以太坊账户</Button>}
                  <div>当前用户：{account === '' ? '无用户连接' : account}</div>
                  <div>
                      <UserOutlined /> 目前网页共有{playerNumber}人/次参加
                  </div>    
            </div>
            <div className='operation'>
                <Input size="large" placeholder='姓名' prefix={<UserOutlined />} />
                <br />
                <Input placeholder='学号' prefix={<UserOutlined />}/>
                <br />
                <Input placeholder='性别' prefix={<UserOutlined />}/>
                <br />
                <Input placeholder='所属社团' prefix={<UserOutlined />}/>
                <br />
                <Button onClick={onjoin}>注册</Button>
            </div>
          </PageContainer>
        </ProLayout>
        
      </div>
    );
    break;
}
};
