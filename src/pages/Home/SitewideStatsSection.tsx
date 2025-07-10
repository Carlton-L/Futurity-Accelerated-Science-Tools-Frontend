import React from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Card,
  Heading,
  Stat,
  Flex,
} from '@chakra-ui/react';
import CountUp from 'react-countup';

interface StatItemProps {
  label: string;
  value: number;
  duration?: number;
  separator?: string;
  isLarge?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  duration = 2.5,
  separator = ',',
  isLarge = false,
}) => (
  <Box textAlign='center' w='100%'>
    <Stat.Root>
      <Stat.ValueText
        fontSize={isLarge ? '2xl' : 'lg'}
        fontWeight='bold'
        color='fg'
        fontFamily='mono'
        lineHeight='1.1'
        mb='1'
      >
        <CountUp
          end={value}
          duration={duration}
          separator={separator}
          preserveValue
        />
      </Stat.ValueText>
      <Stat.Label
        fontSize='2xs'
        color='fg.secondary'
        textTransform='uppercase'
        letterSpacing='wide'
        fontWeight='medium'
      >
        {label}
      </Stat.Label>
    </Stat.Root>
  </Box>
);

interface StatsSectionProps {
  title: string;
  stats: Array<{ label: string; value: number }>;
  color: string;
  textColor: string;
  isHighlighted?: boolean;
}

const StatsSection: React.FC<StatsSectionProps> = ({
  title,
  stats,
  color,
  textColor,
  isHighlighted = false,
}) => (
  <Box
    flex='1'
    minW='0'
    position='relative'
    _before={
      isHighlighted
        ? {
            content: '""',
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            borderRadius: 'lg',
            zIndex: -1,
          }
        : undefined
    }
  >
    <Card.Root
      variant='outline'
      size='sm'
      bg='bg.canvas'
      borderColor='border.muted'
      transition='all 0.2s ease'
      _hover={{
        borderColor: color,
        shadow: 'md',
      }}
      height='100%'
    >
      <Card.Body p='3'>
        <VStack align='stretch' gap='3' height='100%'>
          {/* Header */}
          <Box>
            <Flex align='center' gap='2' mb='1'>
              <Box w='2' h='2' borderRadius='full' bg={color} flexShrink={0} />
              <Heading
                size='xs'
                fontFamily='heading'
                fontWeight='semibold'
                color='fg'
                textTransform='uppercase'
                letterSpacing='wide'
                fontSize='2xs'
              >
                {title}
              </Heading>
            </Flex>
            <Box
              h='0.5'
              bg={color}
              borderRadius='full'
              opacity='0.3'
              w='100%'
            />
          </Box>

          {/* Stats */}
          <VStack gap='2' flex='1' justify='center'>
            {stats.map((stat, index) => (
              <StatItem
                key={index}
                label={stat.label}
                value={stat.value}
                duration={2.5 + index * 0.3}
                isLarge={stats.length === 1}
              />
            ))}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  </Box>
);

const SitewideStatsSection: React.FC = () => {
  const sections = [
    {
      title: 'Business',
      color: '#E07B91', // mature - most established
      textColor: '#FFFFFF',
      stats: [
        { label: 'Organizations', value: 5687580 },
        { label: 'Transactions', value: 93172 },
        { label: 'Press Articles', value: 1157167 },
        { label: 'People', value: 7888202 },
      ],
    },
    {
      title: 'Engineering',
      color: '#C3DE6D', // growing - middle maturity
      textColor: '#1B1B1D',
      stats: [{ label: 'Patents', value: 100002321 }],
      isHighlighted: true,
    },
    {
      title: 'Science',
      color: '#46ACC8', // progressing - approaching mature
      textColor: '#FFFFFF',
      stats: [{ label: 'Scientific Papers', value: 6612423 }],
    },
    {
      title: 'Imagination',
      color: '#6A35D4', // emerging - least mature, most innovative
      textColor: '#FFFFFF',
      stats: [{ label: 'Books', value: 614816 }],
    },
  ];

  return (
    <Box>
      <Box mb='4'>
        <HStack justify='space-between' align='end' mb='2'>
          <Box>
            <Text
              fontSize='xl'
              fontWeight='bold'
              fontFamily='heading'
              color='fg'
              mb='1'
            >
              Platform Analytics
            </Text>
            <Text color='fg.secondary' fontSize='sm'>
              Real-time insights across the Futurity ecosystem
            </Text>
          </Box>
          <Box textAlign='right'>
            <Text
              fontSize='2xs'
              color='fg.muted'
              textTransform='uppercase'
              letterSpacing='wide'
            >
              Live Data
            </Text>
            <Box
              w='1.5'
              h='1.5'
              bg='green.500'
              borderRadius='full'
              display='inline-block'
              animation='pulse 2s infinite'
              ml='2'
            />
          </Box>
        </HStack>
      </Box>

      <HStack
        gap='4'
        align='stretch'
        justify='space-between'
        w='100%'
        wrap='nowrap'
        overflowX='auto'
        pb='1'
      >
        {sections.map((section, index) => (
          <StatsSection
            key={index}
            title={section.title}
            stats={section.stats}
            color={section.color}
            textColor={section.textColor}
            isHighlighted={section.isHighlighted}
          />
        ))}
      </HStack>
    </Box>
  );
};

export default SitewideStatsSection;
