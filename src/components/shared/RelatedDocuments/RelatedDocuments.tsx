import React, { useState } from 'react';
import {
  Box,
  Card,
  Heading,
  HStack,
  VStack,
  Text,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import type {
  RelatedDocumentsProps,
  RelatedDocument,
} from './relatedDocumentsTypes';

// Mock documents for demo
const mockDocuments: RelatedDocument[] = [
  {
    id: 'doc-1',
    filename: 'AI_Market_Analysis_2024.pdf',
    type: 'PDF',
    fileExtension: 'pdf',
    size: '2.4 MB',
    uploadDate: '2024-03-15T10:30:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-2',
    filename: 'Computer_Vision_Architecture_Diagram.png',
    type: 'Image',
    fileExtension: 'png',
    size: '1.8 MB',
    uploadDate: '2024-02-28T14:45:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-3',
    filename: 'Neural_Network_Research_Paper.pdf',
    type: 'PDF',
    fileExtension: 'pdf',
    size: '5.2 MB',
    uploadDate: '2024-01-20T09:15:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-4',
    filename: 'AI_Technology_Roadmap.jpg',
    type: 'Image',
    fileExtension: 'jpg',
    size: '3.1 MB',
    uploadDate: '2024-03-10T16:20:00Z',
    downloadUrl: '#',
  },
  {
    id: 'doc-5',
    filename: 'Machine_Learning_Best_Practices.docx',
    type: 'Document',
    fileExtension: 'docx',
    size: '890 KB',
    uploadDate: '2024-02-15T11:00:00Z',
    downloadUrl: '#',
  },
];

const RelatedDocuments: React.FC<RelatedDocumentsProps> = ({
  documents = mockDocuments,
  height = '400px',
}) => {
  const [sortMethod, setSortMethod] = useState<string>('most-recent');
  const [filterText, setFilterText] = useState<string>('');

  const handleDocumentDownload = (
    documentId: string,
    filename: string
  ): void => {
    // TODO: Replace with actual download functionality
    // Example: window.open(downloadUrl, '_blank');
    console.log(`Download document: ${filename} (ID: ${documentId})`);
  };

  // Filter and sort documents
  const getFilteredAndSortedDocuments = (): RelatedDocument[] => {
    // Filter by search text
    const filtered = documents.filter(
      (document) =>
        document.filename.toLowerCase().includes(filterText.toLowerCase()) ||
        document.type.toLowerCase().includes(filterText.toLowerCase())
    );

    // Sort based on selected method
    switch (sortMethod) {
      case 'most-recent':
        return filtered.sort(
          (a, b) =>
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      case 'oldest':
        return filtered.sort(
          (a, b) =>
            new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        );
      case 'a-z':
        return filtered.sort((a, b) => a.filename.localeCompare(b.filename));
      case 'z-a':
        return filtered.sort((a, b) => b.filename.localeCompare(a.filename));
      case 'type':
        return filtered.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return filtered;
    }
  };

  return (
    <Card.Root width='100%' height={height} mt={6}>
      <Card.Body p={6} display='flex' flexDirection='column' height='100%'>
        <VStack gap={4} align='stretch' height='100%'>
          {/* Header */}
          <Heading as='h2' size='lg' flexShrink={0}>
            Related Documents
          </Heading>

          {/* Controls */}
          <HStack gap={4} align='center' flexShrink={0}>
            <HStack gap={2} align='center'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='gray.700'
                whiteSpace='nowrap'
              >
                Sort by:
              </Text>
              <select
                value={sortMethod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSortMethod(e.target.value)
                }
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  minWidth: '150px',
                }}
              >
                <option value='most-recent'>Most Recent</option>
                <option value='oldest'>Oldest</option>
                <option value='a-z'>A-Z</option>
                <option value='z-a'>Z-A</option>
                <option value='type'>Type</option>
              </select>
            </HStack>
            <Input
              placeholder='Filter documents...'
              value={filterText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilterText(e.target.value)
              }
              size='sm'
              flex='1'
            />
          </HStack>

          {/* Divider */}
          <Box height='1px' bg='gray.200' flexShrink={0} />

          {/* Documents List */}
          <Box
            flex='1'
            overflowY='auto'
            p={2}
            border='1px solid'
            borderColor='gray.100'
            borderRadius='md'
          >
            <VStack gap={2} align='stretch'>
              {getFilteredAndSortedDocuments().map((document) => (
                <Card.Root
                  key={document.id}
                  size='sm'
                  variant='outline'
                  cursor='pointer'
                  _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
                  transition='all 0.2s'
                >
                  <Card.Body p={3}>
                    <HStack justify='space-between' align='center'>
                      <VStack align='stretch' gap={1} flex='1'>
                        <HStack gap={2} align='center'>
                          <Text
                            fontSize='sm'
                            fontWeight='medium'
                            color='blue.600'
                          >
                            {document.filename}
                          </Text>
                          <Box
                            bg='gray.100'
                            color='gray.700'
                            px={2}
                            py={1}
                            borderRadius='sm'
                            fontSize='xs'
                            fontWeight='medium'
                          >
                            {document.type}
                          </Box>
                        </HStack>
                        <HStack gap={4}>
                          <Text fontSize='xs' color='gray.500'>
                            {document.fileExtension.toUpperCase()}
                          </Text>
                          <Text fontSize='xs' color='gray.500'>
                            {document.size}
                          </Text>
                          <Text fontSize='xs' color='gray.500'>
                            {new Date(document.uploadDate).toLocaleDateString()}
                          </Text>
                        </HStack>
                      </VStack>

                      <IconButton
                        size='sm'
                        variant='outline'
                        colorScheme='blue'
                        onClick={() =>
                          handleDocumentDownload(document.id, document.filename)
                        }
                        aria-label={`Download ${document.filename}`}
                      >
                        <FiDownload size={14} />
                      </IconButton>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              ))}

              {getFilteredAndSortedDocuments().length === 0 && (
                <Box p={4} textAlign='center'>
                  <Text color='gray.500'>
                    No documents found matching your filter.
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default RelatedDocuments;
