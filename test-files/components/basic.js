import { Space, Card, Tooltip, Tag, Button } from 'antd';
import { useEffect, useState } from 'react';
import componentsTree3 from '@/assets/componentsTree3.svg'
import componentsTree4 from '@/assets/componentsTree4.svg'
import { useLocation } from 'dva';
import { DownOutlined, UpOutlined } from '@ant-design/icons'; // 引入图标
import AvatarUser from '@/components/AvaterUser/index';
import styles from '../index.less';

const Basic = (props) => {
    const { basicList } = props;

    const location = useLocation();
    const [front, setFront] = useState([]);
    const [back, setBack] = useState([])
    const [frontExpanded, setFrontExpanded] = useState(false);
    const [backExpanded, setBackExpanded] = useState(false)
    const [title, setTitle] = useState('')
    const [nodeType, setNodeType] = useState()

    useEffect(() => {
        const frontData = (basicList && basicList.front_end_apps) || [];
        const backData = (basicList && basicList.back_end_apps) || []
        setFront(frontData);
        setBack(backData)
        setTitle(location?.query?.title)
        setNodeType(location?.query.node_type)
    }, [basicList]);

    const frontExpand = () => {
        setFrontExpanded(!frontExpanded);
    };

    const backExpand = () => {
        setBackExpanded(!backExpanded)
    }

    return (
        <div>
            <Card bodyStyle={{ padding: 0 }} className={styles.risk_basic} bordered={false}>
                <Space size={[8, 16]} wrap align='end'>
                    <div className={styles.title}>
                        <span className={styles.span}>节点名称:</span>
                        <span>
                            <span>
                                {nodeType === '3' && (
                                    <img src={componentsTree3} alt="logo" width={18} height={18} style={{ marginBottom: '4px' }} />
                                )}
                                {nodeType === '4' && (
                                    <img src={componentsTree4} alt="logo" width={18} height={18} style={{ marginBottom: '4px' }} />
                                )}
                            </span>
                            <span style={{ marginLeft: '5px' }}>{title}</span>
                        </span>
                    </div>
                    <div className={styles.title}>
                        <span className={styles.span}>
                            节点负责人:
                        </span>
                        <AvatarUser ad_account={basicList?.manager}></AvatarUser>
                    </div>
                    <div className={styles.title}>
                        <span className={styles.span}>前端APP_ID:</span>
                        {
                            front?.slice(0, frontExpanded ? front.length : 1).map((item, index) => (
                                <Tooltip placement="top" title={item} arrowPointAtCenter key={`${item}_${index}`}>
                                    <Tag className={styles.tagList}>
                                        {item}
                                    </Tag>
                                </Tooltip>
                            ))
                        }
                        {front.length > 1 && (
                            <span className={styles.tag} onClick={frontExpand}>
                                {frontExpanded ? <UpOutlined /> : <DownOutlined />}
                                共{front.length}个
                            </span>
                        )}
                    </div>
                    <div className={styles.title}>
                        <span className={styles.span}>后端APP_ID:</span>
                        {
                            back?.slice(0, backExpanded ? back.length : 1).map((item, index) => (
                                <Tooltip placement="top" title={item} arrowPointAtCenter key={`${item}_${index}`}>
                                    <Tag className={styles.tagList}>
                                        {item}
                                    </Tag>
                                </Tooltip>
                            ))
                        }
                        {back.length > 1 && (
                            <span className={styles.tag} onClick={backExpand}>
                                {backExpanded ? <UpOutlined /> : <DownOutlined />}
                                共{back.length}个
                            </span>
                        )}
                    </div>
                </Space>
            </Card>
        </div>
    );
};

export default Basic;