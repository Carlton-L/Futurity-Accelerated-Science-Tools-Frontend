import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Heading,
  VStack,
  Text,
  Spinner,
  Button,
  HStack,
  Badge,
  Link,
} from '@chakra-ui/react';
import { FiDownload, FiEye, FiFile } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

// TypeScript interfaces
interface DocumentItem {
  name: string;
  url: string;
  download_url: string;
  size: string;
  object: {
    Key: string;
    LastModified: string;
    ETag: string;
    Size: string;
    StorageClass: string;
  };
}

interface RelatedDocumentsResponse {
  rows: DocumentItem[];
  count: number;
}

interface RelatedDocumentsProps {
  subjectSlug?: string;
}

const RelatedDocuments: React.FC<RelatedDocumentsProps> = ({ subjectSlug }) => {
  const theme = useTheme();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!subjectSlug) {
        console.log('No subjectSlug provided to RelatedDocuments');
        setLoading(false);
        return;
      }

      console.log('Fetching documents for subjectSlug:', subjectSlug);
      setLoading(true);
      setError(null);

      try {
        const url = `https://tools.futurity.science/api/subject/related-documents?slug=${subjectSlug}`;
        console.log('Making request to:', url);

        const response = await fetch(url, {
          headers: {
            Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: RelatedDocumentsResponse = await response.json();
        console.log('Documents data received:', data);
        setDocuments(data.rows);
      } catch (err) {
        console.error('Failed to fetch related documents:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load documents'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [subjectSlug]);

  // Helper function to format file size
  const formatFileSize = (bytes: string): string => {
    const size = parseInt(bytes, 10);
    if (size === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));

    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card.Root width='100%' mt={6} bg='bg.canvas'>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            <Heading as='h2' size='lg' color='fg'>
              Related Documents
            </Heading>
            <Box
              height='200px'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <VStack gap={2}>
                <Spinner size='lg' />
                <Text color='fg.muted'>Loading documents...</Text>
              </VStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  if (error) {
    return (
      <Card.Root width='100%' mt={6} bg='bg.canvas'>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            <Heading as='h2' size='lg' color='fg'>
              Related Documents
            </Heading>
            <Box
              height='200px'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <VStack gap={2}>
                <Text color='error' fontSize='lg'>
                  Error loading documents
                </Text>
                <Text color='fg.muted' fontSize='sm'>
                  {error}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  if (!documents.length) {
    return (
      <Card.Root width='100%' mt={6} bg='bg.canvas'>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            <Heading as='h2' size='lg' color='fg'>
              Related Documents
            </Heading>
            <Box
              height='200px'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <Text color='fg.muted'>No documents found for this subject</Text>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root width='100%' mt={6} bg='bg.canvas'>
      <Card.Body p={6}>
        <VStack gap={6} align='stretch'>
          {/* Header */}
          <HStack justify='space-between' align='center'>
            <Heading as='h2' size='lg' color='fg'>
              Related Documents{' '}
              {subjectSlug && (
                <Text as='span' fontSize='sm' color='fg.muted'>
                  ({subjectSlug})
                </Text>
              )}
            </Heading>
            <Badge bg='brand.500' color='brand.contrast' size='lg'>
              {documents.length} documents
            </Badge>
          </HStack>

          {/* Documents Grid */}
          <Box
            maxHeight='400px'
            overflowY='auto'
            border='1px solid'
            borderColor='border.muted'
            borderRadius='md'
            p={4}
            bg='bg'
          >
            <VStack gap={3} align='stretch'>
              {documents.map((doc, index) => (
                <Card.Root
                  key={index}
                  variant='outline'
                  size='sm'
                  bg='bg.canvas'
                  _hover={{
                    bg: 'bg.hover',
                    borderColor: 'brand.400',
                  }}
                  transition='all 0.2s'
                >
                  <Card.Body p={4}>
                    <HStack justify='space-between' align='flex-start'>
                      {/* Document Info */}
                      <HStack gap={3} flex='1'>
                        <Box
                          bg={theme.isDark ? 'brand.400' : 'brand.500'}
                          color='brand.contrast'
                          borderRadius='md'
                          p={2}
                          minWidth='40px'
                          textAlign='center'
                        >
                          <FiFile size={20} />
                        </Box>

                        <VStack gap={1} align='flex-start' flex='1'>
                          <Text
                            fontSize='sm'
                            fontWeight='medium'
                            color='fg'
                            lineHeight='1.3'
                            truncate
                          >
                            {doc.name}
                          </Text>

                          <HStack gap={3} fontSize='xs' color='fg.muted'>
                            <Text>{formatFileSize(doc.size)}</Text>
                            <Text>•</Text>
                            <Text>{getFileExtension(doc.name)}</Text>
                            <Text>•</Text>
                            <Text>{formatDate(doc.object.LastModified)}</Text>
                          </HStack>
                        </VStack>
                      </HStack>

                      {/* Action Buttons */}
                      <HStack gap={2} flexShrink={0}>
                        <Button size='sm' variant='outline' asChild>
                          <Link href={doc.url} target='_blank'>
                            <FiEye size={14} />
                            View
                          </Link>
                        </Button>

                        <Button
                          size='sm'
                          bg='brand'
                          color='brand.contrast'
                          _hover={{
                            bg: 'brand.hover',
                            opacity: 0.9,
                          }}
                          asChild
                        >
                          <Link href={doc.download_url} download={doc.name}>
                            <FiDownload size={14} />
                            Download
                          </Link>
                        </Button>
                      </HStack>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </VStack>
          </Box>

          {/* Summary */}
          <Text fontSize='sm' color='fg.muted' textAlign='center'>
            {documents.length} document{documents.length !== 1 ? 's' : ''}{' '}
            related to this subject
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default RelatedDocuments;
