import TreeComponent from './components/Tree';
import Basic from './components/basic'
import Visualization from './components/visualization'
import RiskList from './components/riskList';
import useTracking from '@/hooks/useTracking';
import styles from './index.less'
import { useLocation, useHistory } from 'dva';
import { Empty, Spin } from 'antd'
import { getTrCleanedTypes, getRiskTrNodeProductInfo } from '@/services/treePerspective'
import { useEffect, useState } from 'react';

let lastClickedNodeId = null; // 用于存储上次点击的节点ID
const TreePerspective = () => {

  const history = useHistory();
  const location = useLocation()
  const { pathname, search } = location;
  const report = useTracking();

  const [riskData, setRiskData] = useState([])
  const [basicList, setBasicList] = useState()
  const [loading, setLoading] = useState(false);
  const [showTree, setShowTree] = useState(true);
  const [total, setTotal] = useState()
  const [sum, setSum] = useState(0)
  const [selectedKeys, setSelectedKeys] = useState([]);

  const handleToggleTreeVisibility = (value) => {
    setShowTree(value);
  };

  const handleTotalChange = (newTotal) => {
    setTotal(newTotal)
  };

  useEffect(() => {
    if(!location?.query?.id){
      setBasicList(null)
      setSelectedKeys([]);
      lastClickedNodeId = null
    }
  }, [location])

  // 点击左侧tree树
  const handleSelect = async (keys, event) => {
    setLoading(true);
    const { selectedNodes } = event;
    const node = selectedNodes[0];

    // 判断是否为相同节点，如果是则直接返回
    if (lastClickedNodeId === node.id) {
      setLoading(false);
      return;
    }

    if (node && (node.node_type === 4 || node.node_type === 3)) {
      updateUrlWithNode(node);
      await cleanedTypes(node.id);
    }

    lastClickedNodeId = node.id; // 更新上次点击的节点ID
    setLoading(false);
  };

  const updateUrlWithNode = (node) => {
    const searchParams = new URLSearchParams(search);
    searchParams.set('title', node.title)
    searchParams.set('id', node.id)
    searchParams.set('node_type', node.node_type)
    searchParams.set('path', node.key)
    history.push({
      pathname,
      search: searchParams.toString(),
    });
  };

  const cleanedTypes = async (id) => {
    const params = {
      id: id
    }
    const { data, code } = await getRiskTrNodeProductInfo({ params })
    if (code === 0) {
      setBasicList(data)
      await trCleanedTypes(data.id)
    }
    setLoading(false);
  }

  const trCleanedTypes = async (id) => {
    const params = {
      product_id: id
    }
    const { data, code } = await getTrCleanedTypes({ params })
    if (code === 0) {
      setRiskData(data)
      setLoading(false);
      const res = data.reduce((total, item) => total + item.count, 0);
      setSum(res)
    }
    setLoading(false);
  }

  useEffect(() => {
    report('pv', '455.46.riskreview-platform.0.pv')
    const data = {
      selectedNodes: [
        {
          id: location?.query?.id,
          key: location?.query?.path,
          node_type: Number(location?.query?.node_type),
          title: location?.query?.title
        }
      ]
    }
    if (location?.query?.id) {
      handleSelect([], data)
      setSelectedKeys([location?.query?.path])
    }
  }, [])

  return (
    <div className={styles.treePerspective}>
      <TreeComponent selectedKey={selectedKeys} onSelect={handleSelect} onToggleTreeVisibility={handleToggleTreeVisibility} showTree={showTree} onTotalChange={handleTotalChange} />
      {!basicList ? (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {total === 0
                  ? '当前您负责的应用暂无风险数据，请选择左侧节点查看详情'
                  : '请选择左侧节点查看详情'}
              </span>
            }
          />
        </div>
      ) : (
        <div className={styles.risk_details}>
          <Spin spinning={loading} tip="Loading...">
            <Basic basicList={basicList}></Basic>
            <Visualization basicList={basicList} sum={sum} showTree={showTree}></Visualization>
            <RiskList riskData={riskData} basicList={basicList}></RiskList>
          </Spin>
        </div>
      )}
    </div>
  );
};

export default TreePerspective;