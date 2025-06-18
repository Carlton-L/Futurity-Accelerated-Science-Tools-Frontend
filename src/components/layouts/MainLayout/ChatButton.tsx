import { IconButton } from '@chakra-ui/react';
import { RiChatAiFill } from 'react-icons/ri';

interface ChatButtonProps {
  onClick: () => void;
}

const ChatButton = ({ onClick }: ChatButtonProps) => {
  return (
    <IconButton
      aria-label='Open chat'
      position='fixed'
      bottom='4'
      right='4'
      borderRadius='full'
      size='2xl'
      zIndex={1000}
      onClick={onClick}
      color='white'
    >
      <RiChatAiFill />
    </IconButton>
  );
};

export default ChatButton;
