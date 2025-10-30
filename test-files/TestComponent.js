import Basic from './components/basic';

// 这个文件有多种使用 Basic 的方式
const TestComponent = () => {
  // 1. 作为函数调用
  const result1 = Basic({ basicList: [] });
  
  // 2. 作为组件使用
  const component1 = <Basic basicList={data} />;
  
  // 3. 在条件语句中使用
  const component2 = showBasic ? <Basic basicList={list} /> : null;
  
  // 4. 在数组中使用
  const components = [
    <Basic key="1" basicList={list1} />,
    <Basic key="2" basicList={list2} />,
  ];
  
  // 5. 作为prop传递
  const MyWrapper = ({ ComponentToRender = Basic }) => {
    return <ComponentToRender basicList={data} />;
  };
  
  // 6. 动态调用
  const dynamicBasic = Basic;
  const result2 = dynamicBasic({ basicList: [] });
  
  return (
    <div>
      {component1}
      {component2}
      {components}
      <MyWrapper />
    </div>
  );
};

export default TestComponent;