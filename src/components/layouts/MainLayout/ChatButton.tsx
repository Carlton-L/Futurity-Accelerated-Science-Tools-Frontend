import { IconButton } from '@chakra-ui/react';
import { RiChatAiFill } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';

interface ChatButtonProps {
  onClick: () => void;
}

const ChatButton = ({ onClick }: ChatButtonProps) => {
  const { isDark } = useTheme();
  return (
    <IconButton
      aria-label='Open chat'
      position='fixed'
      bottom='4'
      right='4'
      borderRadius='full'
      borderWidth='1px'
      borderColor={isDark ? '#ffffff' : '#000000'}
      size='2xl'
      zIndex={1000}
      onClick={onClick}
      color={isDark ? 'white' : 'black'}
      backgroundColor={isDark ? '#1a1a1a' : '#fafafa'}
    >
      <RiChatAiFill />
    </IconButton>
  );
};

export default ChatButton;
