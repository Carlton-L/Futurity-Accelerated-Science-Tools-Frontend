import React, { forwardRef } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Checkbox,
  Flex,
  FileUpload,
  IconButton,
} from '@chakra-ui/react';
import { HiCloudUpload, HiDocument, HiSearch, HiTrash } from 'react-icons/hi';
import type {
  KnowledgebaseDocument,
  KnowledgebaseQueryResponse,
} from './types';

interface KnowledgebaseProps {
  // Document state
  kbDocuments: KnowledgebaseDocument[];
  filteredKbDocuments: KnowledgebaseDocument[];
  kbLoading: boolean;
  kbError: string;

  // File upload state
  kbUploadLoading: boolean;
  kbUploadError: string;
  kbUploadSuccess: boolean;

  // Query state
  kbQuery: string;
  kbQueryResults: KnowledgebaseQueryResponse | null;
  kbQueryLoading: boolean;
  kbQueryError: string;

  // Filter state
  selectedFileTypes: Set<string>;
  deletingDocuments: Set<string>;

  // Handlers
  onKbQueryChange: (query: string) => void;
  onKbQuery: () => void;
  onFileUpload: (files: File[]) => void;
  onFileTypeToggle: (fileType: string) => void;
  onDeleteDocument: (documentId: string, documentTitle: string) => void;
  onRetryFetch: () => void;
}

const Knowledgebase = forwardRef<HTMLDivElement, KnowledgebaseProps>(
  (
    {
      kbDocuments,
      filteredKbDocuments,
      kbLoading,
      kbError,
      kbUploadLoading,
      kbUploadError,
      kbUploadSuccess,
      kbQuery,
      kbQueryResults,
      kbQueryLoading,
      kbQueryError,
      selectedFileTypes,
      deletingDocuments,
      onKbQueryChange,
      onKbQuery,
      onFileUpload,
      onFileTypeToggle,
      onDeleteDocument,
      onRetryFetch,
    },
    ref
  ) => {
    return (
      <Card.Root
        ref={ref}
        borderWidth='1px'
        borderColor='border.emphasized'
        bg='bg.canvas'
      >
        <Card.Body p={6}>
          <VStack gap={6} align='stretch'>
            <Text color='fg.muted' fontSize='sm' fontFamily='body'>
              Upload documents to build your knowledge base, then query across
              all documents to find relevant information. The system uses
              semantic search to find the most relevant passages from your
              uploaded content.
            </Text>

            {/* Query Section */}
            <Box>
              <Heading as='h4' size='sm' mb={3} fontFamily='heading' color='fg'>
                Query Knowledgebase
              </Heading>

              <VStack gap={3} align='stretch'>
                <Flex gap={2}>
                  <Input
                    placeholder='Enter your question or search query...'
                    value={kbQuery}
                    onChange={(e) => onKbQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onKbQuery();
                      }
                    }}
                    bg='bg'
                    borderColor='border.emphasized'
                    color='fg'
                    _placeholder={{ color: 'fg.subtle' }}
                    _focus={{
                      borderColor: 'brand.400',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                    }}
                  />
                  <Button
                    variant='solid'
                    onClick={onKbQuery}
                    loading={kbQueryLoading}
                    disabled={!kbQuery.trim() || kbQueryLoading}
                    bg='brand'
                    color='white'
                    _hover={{ bg: 'brand.hover' }}
                  >
                    <HiSearch size={16} />
                    Query
                  </Button>
                </Flex>

                {kbQueryError && (
                  <Box
                    p={3}
                    bg='red.50'
                    borderRadius='md'
                    border='1px solid'
                    borderColor='red.200'
                  >
                    <Text fontSize='sm' color='red.700' fontFamily='body'>
                      Query failed: {kbQueryError}
                    </Text>
                  </Box>
                )}

                {/* Query Results Placeholder / Results */}
                {kbQueryResults ? (
                  <Box
                    border='1px solid'
                    borderColor='border.emphasized'
                    borderRadius='md'
                    p={4}
                    maxH='500px'
                    overflowY='auto'
                    bg='bg.canvas'
                  >
                    <VStack gap={4} align='stretch'>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        color='brand.500'
                        fontFamily='heading'
                      >
                        Query: "{kbQueryResults.query_text}"
                      </Text>

                      {kbQueryResults.grouped_results.length === 0 ? (
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          textAlign='center'
                          py={4}
                          fontFamily='body'
                        >
                          No results found for your query.
                        </Text>
                      ) : (
                        kbQueryResults.grouped_results.map((group) => (
                          <Box key={group.file_type}>
                            <Text
                              fontSize='sm'
                              fontWeight='bold'
                              color='fg'
                              mb={2}
                              textTransform='uppercase'
                              fontFamily='heading'
                            >
                              {group.file_type.replace('_', ' ')} Results (
                              {group.results.length})
                            </Text>

                            <VStack gap={3} align='stretch'>
                              {group.results.map((result) => (
                                <Box
                                  key={result.library_card.document_uuid}
                                  p={3}
                                  border='1px solid'
                                  borderColor='border.emphasized'
                                  borderRadius='md'
                                  bg='bg.subtle'
                                >
                                  <VStack gap={2} align='stretch'>
                                    <HStack
                                      justify='space-between'
                                      align='flex-start'
                                    >
                                      <Text
                                        fontSize='sm'
                                        fontWeight='medium'
                                        color='brand.500'
                                        fontFamily='heading'
                                      >
                                        {result.library_card.title}
                                      </Text>
                                      <Text
                                        fontSize='xs'
                                        color='fg.muted'
                                        fontFamily='mono'
                                      >
                                        Score: {result.max_score.toFixed(3)}
                                      </Text>
                                    </HStack>

                                    {result.snippets.map((snippet, index) => (
                                      <Box
                                        key={snippet.chunk_id}
                                        pl={3}
                                        borderLeft='2px solid'
                                        borderColor='brand.400'
                                      >
                                        <HStack
                                          justify='space-between'
                                          align='flex-start'
                                          mb={1}
                                        >
                                          <Text
                                            fontSize='xs'
                                            color='fg.muted'
                                            fontWeight='medium'
                                            fontFamily='heading'
                                          >
                                            Snippet {index + 1}
                                          </Text>
                                          <Text
                                            fontSize='xs'
                                            color='fg.subtle'
                                            fontFamily='mono'
                                          >
                                            {snippet.score.toFixed(3)}
                                          </Text>
                                        </HStack>
                                        <Text
                                          fontSize='xs'
                                          color='fg'
                                          lineHeight='1.4'
                                          fontFamily='body'
                                        >
                                          {snippet.document_snippet}
                                        </Text>
                                      </Box>
                                    ))}
                                  </VStack>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        ))
                      )}
                    </VStack>
                  </Box>
                ) : (
                  /* Query Results Placeholder - Always visible when no results */
                  <Flex
                    height='150px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='border.muted'
                    borderRadius='md'
                    bg='bg.subtle'
                  >
                    <VStack gap={2}>
                      <HiSearch
                        size={32}
                        color='var(--chakra-colors-fg-muted)'
                      />
                      <Text
                        color='fg.muted'
                        fontSize='sm'
                        textAlign='center'
                        fontFamily='body'
                      >
                        {kbQuery.trim()
                          ? kbQueryLoading
                            ? 'Searching...'
                            : 'Enter a query above to search your documents'
                          : 'Enter a query above to search your documents'}
                      </Text>
                    </VStack>
                  </Flex>
                )}
              </VStack>
            </Box>

            {/* Documents List Section */}
            <Box>
              <Heading as='h4' size='sm' mb={3} fontFamily='heading' color='fg'>
                Documents Library
              </Heading>

              {/* File Type Filters */}
              <Box mb={4}>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  mb={2}
                  fontFamily='heading'
                  color='fg'
                >
                  Filter by File Type
                </Text>
                <HStack gap={3} wrap='wrap'>
                  {['pdf', 'image', 'audio', 'video', 'txt', 'raw_text'].map(
                    (fileType) => (
                      <Checkbox.Root
                        key={fileType}
                        checked={selectedFileTypes.has(fileType)}
                        onCheckedChange={() => onFileTypeToggle(fileType)}
                        size='sm'
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label
                          fontSize='sm'
                          textTransform='capitalize'
                          fontFamily='body'
                          color='fg'
                        >
                          {fileType.replace('_', ' ')} (
                          {
                            kbDocuments.filter(
                              (doc) => doc.file_type === fileType
                            ).length
                          }
                          )
                        </Checkbox.Label>
                      </Checkbox.Root>
                    )
                  )}
                </HStack>
              </Box>

              {kbLoading ? (
                <Flex height='200px' align='center' justify='center'>
                  <Text color='fg.muted' fontSize='sm' fontFamily='body'>
                    Loading documents...
                  </Text>
                </Flex>
              ) : kbError ? (
                <Box
                  p={4}
                  bg='red.50'
                  borderRadius='md'
                  border='1px solid'
                  borderColor='red.200'
                >
                  <Text fontSize='sm' color='red.700' fontFamily='body'>
                    {kbError}
                  </Text>
                  <Button
                    size='sm'
                    variant='outline'
                    colorScheme='red'
                    mt={2}
                    onClick={onRetryFetch}
                  >
                    Retry
                  </Button>
                </Box>
              ) : filteredKbDocuments.length === 0 ? (
                <Flex
                  height='200px'
                  align='center'
                  justify='center'
                  border='2px dashed'
                  borderColor='border.muted'
                  borderRadius='md'
                  bg='bg.subtle'
                >
                  <VStack gap={2}>
                    <HiDocument
                      size={48}
                      color='var(--chakra-colors-fg-muted)'
                    />
                    <Text
                      color='fg.muted'
                      fontSize='sm'
                      textAlign='center'
                      fontFamily='body'
                    >
                      {selectedFileTypes.size === 0
                        ? 'Select file types to view documents'
                        : 'No documents found for selected file types'}
                    </Text>
                  </VStack>
                </Flex>
              ) : (
                <Box
                  maxH='400px'
                  overflowY='auto'
                  border='1px solid'
                  borderColor='border.emphasized'
                  borderRadius='md'
                  p={3}
                  bg='bg.canvas'
                >
                  <VStack gap={2} align='stretch'>
                    {filteredKbDocuments.map((doc) => {
                      const isDeleting = deletingDocuments.has(
                        doc.document_uuid
                      );

                      return (
                        <Box
                          key={doc.document_uuid}
                          p={3}
                          border='1px solid'
                          borderColor='border.emphasized'
                          borderRadius='md'
                          bg='bg.subtle'
                          _hover={{
                            bg: 'bg.hover',
                          }}
                          opacity={isDeleting ? 0.6 : 1}
                          position='relative'
                        >
                          {isDeleting && (
                            <Box
                              position='absolute'
                              top='50%'
                              left='50%'
                              transform='translate(-50%, -50%)'
                              zIndex={1}
                            >
                              <Text
                                fontSize='sm'
                                color='fg.muted'
                                fontFamily='body'
                              >
                                Deleting...
                              </Text>
                            </Box>
                          )}

                          <HStack justify='space-between' align='flex-start'>
                            <VStack gap={1} align='stretch' flex='1'>
                              <HStack gap={2} align='center'>
                                <Text
                                  fontSize='sm'
                                  fontWeight='medium'
                                  color='brand.500'
                                  fontFamily='heading'
                                >
                                  {doc.title}
                                </Text>
                                <Box
                                  bg='brand.100'
                                  color='brand.800'
                                  px={2}
                                  py={1}
                                  borderRadius='sm'
                                  fontSize='xs'
                                  fontWeight='medium'
                                  textTransform='uppercase'
                                  fontFamily='heading'
                                >
                                  {doc.file_type.replace('_', ' ')}
                                </Box>
                              </HStack>

                              {doc.summary && (
                                <Text
                                  fontSize='xs'
                                  color='fg.muted'
                                  lineHeight='1.4'
                                  overflow='hidden'
                                  textOverflow='ellipsis'
                                  display='-webkit-box'
                                  fontFamily='body'
                                  style={{
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {doc.summary.replace(/^"|"$/g, '')}
                                </Text>
                              )}

                              <Text
                                fontSize='xs'
                                color='fg.subtle'
                                fontFamily='body'
                              >
                                Uploaded:{' '}
                                {new Date(
                                  doc.ingestion_time
                                ).toLocaleDateString()}
                              </Text>
                            </VStack>

                            {/* Delete Button */}
                            <IconButton
                              aria-label='Delete document'
                              size='sm'
                              variant='ghost'
                              colorScheme='red'
                              onClick={() =>
                                onDeleteDocument(doc.document_uuid, doc.title)
                              }
                              disabled={isDeleting}
                              loading={isDeleting}
                            >
                              <HiTrash size={16} />
                            </IconButton>
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              )}
            </Box>

            {/* File Upload Section */}
            <Box>
              <Heading as='h4' size='sm' mb={3} fontFamily='heading' color='fg'>
                Upload Document
              </Heading>

              <FileUpload.Root
                accept='.pdf,.jpg,.jpeg,.png,.gif,.bmp,.txt,.mp3,.wav,.mp4,.avi,.mov'
                onFileChange={(details) => onFileUpload(details.acceptedFiles)}
                disabled={kbUploadLoading}
                width='100%'
              >
                <FileUpload.Dropzone
                  width='100%'
                  minH='120px'
                  borderColor='border.emphasized'
                  border='2px dashed'
                  borderRadius='md'
                  bg='bg.canvas'
                  _hover={{
                    borderColor: 'brand.400',
                    bg: 'bg.subtle',
                  }}
                >
                  <VStack gap={2} py={4}>
                    <FileUpload.Trigger asChild>
                      <Button
                        variant='outline'
                        loading={kbUploadLoading}
                        disabled={kbUploadLoading}
                        size='lg'
                        bg='bg.canvas'
                        borderColor='border.emphasized'
                        color='fg'
                        _hover={{
                          bg: 'bg.hover',
                          borderColor: 'brand.400',
                        }}
                      >
                        <HiCloudUpload size={20} />
                        {kbUploadLoading
                          ? 'Uploading...'
                          : 'Choose File or Drop Here'}
                      </Button>
                    </FileUpload.Trigger>
                    <Text
                      fontSize='sm'
                      color='fg.muted'
                      textAlign='center'
                      fontFamily='body'
                    >
                      Supported formats: PDF, Images (JPG, PNG, GIF, BMP), Text
                      files, Audio (MP3, WAV), Video (MP4, AVI, MOV)
                    </Text>
                  </VStack>
                </FileUpload.Dropzone>
                <FileUpload.HiddenInput />
              </FileUpload.Root>

              {kbUploadSuccess && (
                <Box
                  mt={3}
                  p={3}
                  bg='green.50'
                  borderRadius='md'
                  border='1px solid'
                  borderColor='green.200'
                >
                  <Text fontSize='sm' color='green.700' fontFamily='body'>
                    Document uploaded successfully! Ingestion started.
                  </Text>
                </Box>
              )}

              {kbUploadError && (
                <Box
                  mt={3}
                  p={3}
                  bg='red.50'
                  borderRadius='md'
                  border='1px solid'
                  borderColor='red.200'
                >
                  <Text fontSize='sm' color='red.700' fontFamily='body'>
                    Upload failed: {kbUploadError}
                  </Text>
                </Box>
              )}
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }
);

Knowledgebase.displayName = 'Knowledgebase';

export default Knowledgebase;
