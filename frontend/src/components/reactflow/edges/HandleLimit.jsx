import { Handle, useNodeConnections } from "@xyflow/react";

const HandleLimit = ({ connectionCount, ...rest }) => {
  const connections = useNodeConnections({
    handleType: rest.type,
  });

  return (
    <Handle
      {...rest}
      isConnectable={connections.length < connectionCount}
      data-testid="Handle"
    />
  );
};

export default HandleLimit;