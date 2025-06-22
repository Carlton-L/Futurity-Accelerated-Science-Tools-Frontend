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
      borderWidth='1px'
      borderColor='border.emphasized'
      size='2xl'
      zIndex={1000}
      onClick={onClick}
      color='fg'
      bg='bg.canvas'
      _hover={{
        bg: 'bg.hover',
      }}
      _active={{
        bg: 'bg.active',
      }}
      transition='all 0.2s'
    >
      <RiChatAiFill />
    </IconButton>
  );
};

export default ChatButton;
