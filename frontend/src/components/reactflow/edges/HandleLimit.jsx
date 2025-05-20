import { Handle, useNodeConnections } from '@xyflow/react';
 
const HandleLimit = (props) => {
  const connections = useNodeConnections({
    handleType: props.type,
  });
 
  return (
    <Handle
      {...props}
      isConnectable={connections.length < props.connectionCount}
    />
  );
};
 
export default HandleLimit;