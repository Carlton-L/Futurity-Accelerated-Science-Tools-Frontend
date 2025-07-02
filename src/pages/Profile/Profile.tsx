import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  Card,
  Avatar,
  Badge,
  IconButton,
  Field,
  InputGroup,
  Container,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Alert,
} from '@chakra-ui/react';
import {
  FiEdit2,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiCalendar,
  FiMail,
  FiUser,
  FiLock,
  FiCamera,
  FiUpload,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  userService,
  type ExtendedUserData,
  type UserRelationshipsResponse,
  type ProfileUpdateRequest,
} from '../../services/userService';
import { useToast, ToastDisplay } from '../Lab/ToastSystem';
import type {
  EditingState,
  FormData,
  ShowPasswordState,
  ValidationErrors,
  EditableFieldProps,
  PasswordFieldProps,
  ProfileCardProps,
} from './types';

// Move components outside to prevent re-creation on every render
const ProfileCard: React.FC<ProfileCardProps> = ({
  title,
  icon: Icon,
  children,
  bg = 'bg.canvas',
}) => (
  <Card.Root bg={bg} borderColor='border.emphasized'>
    <Card.Header>
      <HStack gap={3}>
        <Icon size={20} color='var(--chakra-colors-fg)' />
        <Heading size='md' color='fg'>
          {title}
        </Heading>
      </HStack>
    </Card.Header>
    <Card.Body>{children}</Card.Body>
  </Card.Root>
);

const EditableField: React.FC<
  EditableFieldProps & {
    isEditing: boolean;
    formData: FormData;
    errors: ValidationErrors;
    isLoading: boolean;
    isUpdating: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onFormChange: (field: keyof FormData, value: string) => void;
  }
> = ({
  field,
  label,
  value,
  placeholder,
  type = 'text',
  isTextarea = false,
  helper = null,
  isEditing,
  formData,
  errors,
  isLoading,
  isUpdating,
  onEdit,
  onCancel,
  onSave,
  onFormChange,
}) => (
  <Field.Root invalid={!!errors[field]}>
    <Field.Label color='fg.secondary'>{label}</Field.Label>
    {isEditing ? (
      <VStack gap={3} align='stretch'>
        {isTextarea ? (
          <Textarea
            value={formData[field]}
            onChange={(e) => onFormChange(field, e.target.value)}
            placeholder={placeholder}
            rows={4}
            bg='bg.canvas'
            disabled={isLoading}
          />
        ) : (
          <Input
            type={type}
            value={formData[field]}
            onChange={(e) => onFormChange(field, e.target.value)}
            placeholder={placeholder}
            bg='bg.canvas'
            disabled={isLoading}
          />
        )}
        <HStack gap={2}>
          <Button
            size='sm'
            variant='solid'
            onClick={onSave}
            loading={isLoading}
          >
            <FiSave size={16} color='white' />
            Save
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={onCancel}
            color='fg'
            disabled={isLoading}
          >
            <FiX size={16} color='currentColor' />
            Cancel
          </Button>
        </HStack>
        {errors[field] && <Field.ErrorText>{errors[field]}</Field.ErrorText>}
      </VStack>
    ) : (
      <HStack gap={2} align='start'>
        <Box flex={1}>
          {isUpdating ? (
            isTextarea ? (
              <SkeletonText noOfLines={3} gap={2} />
            ) : (
              <Skeleton height='20px' />
            )
          ) : value ? (
            <Text color='fg' wordBreak='break-word'>
              {value}
            </Text>
          ) : (
            <Text color='fg.muted' fontStyle='italic'>
              Not provided
            </Text>
          )}
          {helper && !isUpdating && (
            <Field.HelperText>{helper}</Field.HelperText>
          )}
        </Box>
        {!isUpdating && (
          <IconButton
            size='sm'
            variant='ghost'
            onClick={onEdit}
            aria-label={`Edit ${label}`}
            alignSelf='flex-start'
            color='fg'
          >
            <FiEdit2 size={16} />
          </IconButton>
        )}
      </HStack>
    )}
  </Field.Root>
);

const PasswordField: React.FC<
  PasswordFieldProps & {
    formData: FormData;
    errors: ValidationErrors;
    showPassword: boolean;
    onFormChange: (field: keyof FormData, value: string) => void;
    onTogglePassword: () => void;
  }
> = ({
  field,
  label,
  placeholder,
  formData,
  errors,
  showPassword,
  onFormChange,
  onTogglePassword,
}) => (
  <Field.Root invalid={!!errors[`${field}Password` as keyof ValidationErrors]}>
    <Field.Label color='fg.secondary'>{label}</Field.Label>
    <InputGroup
      endElement={
        <IconButton
          variant='ghost'
          size='sm'
          onClick={onTogglePassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </IconButton>
      }
    >
      <Input
        type={showPassword ? 'text' : 'password'}
        value={formData[`${field}Password` as keyof FormData]}
        onChange={(e) =>
          onFormChange(`${field}Password` as keyof FormData, e.target.value)
        }
        placeholder={placeholder}
        bg='bg.canvas'
      />
    </InputGroup>
    {errors[`${field}Password` as keyof ValidationErrors] && (
      <Field.ErrorText>
        {errors[`${field}Password` as keyof ValidationErrors]}
      </Field.ErrorText>
    )}
  </Field.Root>
);

const Profile: React.FC = () => {
  const { user: authUser, workspace, token, refreshUser } = useAuth();
  const { toast, toasts, removeToast, executeUndo } = useToast();

  // State for extended user data
  const [user, setUser] = useState<ExtendedUserData | null>(null);
  const [relationships, setRelationships] =
    useState<UserRelationshipsResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Initialize all hooks first (React hooks rules)
  const [isEditing, setIsEditing] = useState<EditingState>({
    fullname: false,
    biography: false,
    email: false,
    password: false,
  });

  const [formData, setFormData] = useState<FormData>({
    fullname: '',
    biography: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState<ShowPasswordState>({
    current: false,
    new: false,
    confirm: false,
  });

  // State for tracking which sections are updating
  const [isUpdating, setIsUpdating] = useState<{
    fullname: boolean;
    biography: boolean;
    email: boolean;
    password: boolean;
  }>({
    fullname: false,
    biography: false,
    email: false,
    password: false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [isUploadingPicture, setIsUploadingPicture] = useState<boolean>(false);

  // Load user data and relationships
  useEffect(() => {
    const loadUserData = async () => {
      console.log('=== Profile useEffect triggered ===');
      console.log('authUser:', authUser);
      console.log('authUser._id:', authUser?._id);
      console.log('token exists:', !!token);

      if (!authUser?._id || !token) {
        console.log('❌ Missing auth user or token:', {
          userId: authUser?._id,
          hasToken: !!token,
          authUser: authUser,
        });
        return;
      }

      setIsLoadingData(true);
      console.log('🚀 Loading user data for auth user ID:', authUser._id);

      try {
        // Load extended user data from management API (this will handle the user ID mapping internally)
        console.log('📡 About to call userService.getExtendedUserData...');
        const extendedUserData = await userService.getExtendedUserData(
          authUser._id,
          token
        );
        console.log(
          '✅ Successfully loaded user data from management API:',
          extendedUserData
        );
        setUser(extendedUserData);

        // Load user relationships using the auth user ID
        console.log('📡 About to call userService.getUserRelationships...');
        const relationshipsData = await userService.getUserRelationships(
          authUser._id,
          token
        );
        setRelationships(relationshipsData);
        console.log('✅ Successfully loaded relationships:', relationshipsData);

        // Initialize form data
        setFormData({
          fullname: extendedUserData.profile?.fullname || '',
          biography: extendedUserData.profile?.biography || '',
          email: extendedUserData.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        console.log('✅ Profile data loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load user data:', error);
        toast({
          title: 'Failed to load profile',
          description:
            'Unable to load your profile data. Please try refreshing the page.',
          status: 'error',
        });
      } finally {
        setIsLoadingData(false);
        console.log('🏁 Loading complete');
      }
    };

    loadUserData();
  }, [authUser, token, toast]);

  // Early return after all hooks are declared
  if (isLoadingData || !user) {
    return (
      <Container maxW='1440px' px={6} py={8}>
        <VStack gap={6} align='stretch'>
          {/* Header Skeleton */}
          <Box>
            <Skeleton height='40px' width='200px' mb={2} />
            <SkeletonText noOfLines={1} width='60%' />
          </Box>

          {/* Profile Photo & Basic Info Skeleton */}
          <Card.Root bg='bg.canvas' borderColor='border.emphasized'>
            <Card.Header>
              <HStack gap={3}>
                <Skeleton height='20px' width='20px' />
                <Skeleton height='24px' width='280px' />
              </HStack>
            </Card.Header>
            <Card.Body>
              <VStack gap={6} align='stretch'>
                <HStack gap={6}>
                  <Box position='relative'>
                    <SkeletonCircle size='128px' />
                  </Box>
                  <VStack align='start' gap={4} flex={1}>
                    <Skeleton height='28px' width='200px' />
                    <SkeletonText noOfLines={2} width='80%' />
                    <HStack gap={2}>
                      <Skeleton
                        height='24px'
                        width='120px'
                        borderRadius='full'
                      />
                      <Skeleton
                        height='24px'
                        width='100px'
                        borderRadius='full'
                      />
                    </HStack>
                  </VStack>
                </HStack>
                <Skeleton height='60px' width='100%' />
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEdit = (field: keyof EditingState): void => {
    if (field === 'email') {
      toast({
        title: 'Feature not available',
        description: 'Email editing is not yet implemented.',
        status: 'info',
      });
      return;
    }

    setIsEditing((prev) => ({ ...prev, [field]: true }));
    // Reset form data to current user values when starting to edit
    if (field !== 'password') {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === 'fullname'
            ? user.profile?.fullname || ''
            : field === 'biography'
            ? user.profile?.biography || ''
            : field === 'email'
            ? user.email || ''
            : prev[field],
      }));
    }
  };

  const handleCancel = (field: keyof EditingState): void => {
    setIsEditing((prev) => ({ ...prev, [field]: false }));
    // Reset form data
    if (field === 'password') {
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === 'fullname'
            ? user.profile?.fullname || ''
            : field === 'biography'
            ? user.profile?.biography || ''
            : field === 'email'
            ? user.email || ''
            : prev[field],
      }));
    }
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validatePassword = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSave = async (field: keyof EditingState): Promise<void> => {
    if (!user || !token || !authUser?._id) return;

    // Set loading for the specific field
    setIsUpdating((prev) => ({ ...prev, [field]: true }));
    setIsLoading(true);
    setErrors({});

    try {
      if (field === 'password') {
        const passwordErrors = validatePassword();
        if (Object.keys(passwordErrors).length > 0) {
          setErrors(passwordErrors);
          return;
        }

        try {
          await userService.changePassword(
            authUser._id, // Use auth user ID for password changes
            {
              currentPassword: formData.currentPassword,
              newPassword: formData.newPassword,
            },
            token
          );

          toast({
            title: 'Password updated',
            description: 'Your password has been successfully changed.',
            status: 'success',
          });

          // Clear password fields
          setFormData((prev) => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }));
        } catch (error) {
          toast({
            title: 'Feature not available',
            description:
              'Password change functionality is not yet implemented.',
            status: 'info',
          });
          return;
        }
      } else {
        // Profile update - userService will handle the user ID mapping
        const updateData: Partial<ProfileUpdateRequest> = {};
        if (field === 'fullname') updateData.fullname = formData.fullname;
        if (field === 'biography') updateData.biography = formData.biography;
        if (field === 'email') updateData.email = formData.email;

        console.log('Attempting to update profile via API...', updateData);
        const updatedUser = await userService.updateProfile(
          authUser._id,
          updateData,
          token
        );

        // Update the user state with the new data
        setUser(updatedUser);

        toast({
          title: 'Profile updated',
          description: `Your ${field} has been successfully updated.`,
          status: 'success',
        });
      }

      setIsEditing((prev) => ({ ...prev, [field]: false }));
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Update failed',
        description: `Failed to update your profile: ${errorMessage}`,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
      setIsUpdating((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleProfilePictureChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          status: 'error',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          status: 'error',
        });
        return;
      }

      setProfilePictureFile(file);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePictureFile || !user || !token) return;

    setIsUploadingPicture(true);
    try {
      await userService.uploadProfilePicture(
        user._id,
        profilePictureFile,
        token
      );

      // Refresh user data to get new picture URLs
      const updatedUser = await userService.getExtendedUserData(
        user._id,
        token
      );
      setUser(updatedUser);

      if (refreshUser) {
        await refreshUser();
      }

      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been successfully updated.',
        status: 'success',
      });

      setProfilePictureFile(null);
      // Reset the file input
      const fileInput = document.getElementById(
        'profile-picture-input'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Feature not available',
        description:
          'Profile picture upload functionality is not yet implemented.',
        status: 'info',
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  return (
    <Container maxW='1440px' px={6} py={8}>
      <VStack gap={6} align='stretch'>
        {/* Header */}
        <Box>
          <Heading size='xl' color='fg' mb={2}>
            User Profile
          </Heading>
          <Text color='fg.secondary'>
            Manage your account settings and personal information
          </Text>
        </Box>

        {/* Profile Photo & Basic Info */}
        <ProfileCard title='Profile Photo & Basic Information' icon={FiUser}>
          <VStack gap={6} align='stretch'>
            <HStack gap={6}>
              <Box position='relative'>
                <Avatar.Root size='2xl'>
                  <Avatar.Image
                    src={user.profile?.picture_url}
                    alt={user.profile?.fullname || user.email}
                  />
                  <Avatar.Fallback>
                    {(user.profile?.fullname || user.email || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <Box position='absolute' bottom='0' right='0'>
                  <input
                    id='profile-picture-input'
                    type='file'
                    accept='image/*'
                    onChange={handleProfilePictureChange}
                    style={{ display: 'none' }}
                  />
                  <IconButton
                    size='sm'
                    variant='solid'
                    borderRadius='full'
                    aria-label='Upload photo'
                    onClick={() =>
                      document.getElementById('profile-picture-input')?.click()
                    }
                  >
                    <FiCamera size={16} color='white' />
                  </IconButton>
                </Box>
              </Box>
              <VStack align='start' gap={4} flex={1}>
                {/* Show upload button if file is selected */}
                {profilePictureFile && (
                  <HStack gap={2}>
                    <Text fontSize='sm' color='fg.secondary'>
                      Selected: {profilePictureFile.name}
                    </Text>
                    <Button
                      size='sm'
                      variant='solid'
                      onClick={handleProfilePictureUpload}
                      loading={isUploadingPicture}
                    >
                      <FiUpload size={16} color='white' />
                      Upload
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setProfilePictureFile(null)}
                      color='fg'
                    >
                      <FiX size={16} color='currentColor' />
                      Cancel
                    </Button>
                  </HStack>
                )}

                {/* Editable Full Name */}
                <EditableField
                  field='fullname'
                  label='Full Name'
                  value={user.profile?.fullname || ''}
                  placeholder='Enter your full name'
                  isEditing={isEditing.fullname}
                  formData={formData}
                  errors={errors}
                  isLoading={isLoading}
                  isUpdating={isUpdating.fullname}
                  onEdit={() => handleEdit('fullname')}
                  onCancel={() => handleCancel('fullname')}
                  onSave={() => handleSave('fullname')}
                  onFormChange={handleFormChange}
                />

                {/* Editable Biography */}
                <EditableField
                  field='biography'
                  label='Biography'
                  value={user.profile?.biography || ''}
                  placeholder='Tell us about yourself...'
                  isTextarea={true}
                  isEditing={isEditing.biography}
                  formData={formData}
                  errors={errors}
                  isLoading={isLoading}
                  isUpdating={isUpdating.biography}
                  onEdit={() => handleEdit('biography')}
                  onCancel={() => handleCancel('biography')}
                  onSave={() => handleSave('biography')}
                  onFormChange={handleFormChange}
                />

                {/* Status Badges */}
                <HStack gap={2} wrap='wrap'>
                  {relationships?.organizations?.[0] && (
                    <Badge variant='subtle' colorPalette='blue'>
                      {relationships.organizations[0].ent_name} •{' '}
                      {relationships.organizations[0].user_relationships?.[0]
                        ?.charAt(0)
                        .toUpperCase() +
                        relationships.organizations[0].user_relationships?.[0]?.slice(
                          1
                        )}
                    </Badge>
                  )}
                  {user.auth?.email_validated && (
                    <Badge variant='subtle' colorPalette='green'>
                      Email Verified
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </ProfileCard>

        {/* Organization & Team Memberships */}
        {relationships &&
          (relationships.organizations.length > 0 ||
            relationships.teams.length > 0) && (
            <ProfileCard title='Organization & Team Memberships' icon={FiUsers}>
              <VStack gap={4} align='stretch'>
                {relationships.organizations.length > 0 && (
                  <Box>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg.secondary'
                      mb={2}
                    >
                      Organizations
                    </Text>
                    <VStack gap={2} align='stretch'>
                      {relationships.organizations.map((org) => (
                        <HStack
                          key={org._id}
                          justify='space-between'
                          p={3}
                          bg='bg.subtle'
                          borderRadius='md'
                        >
                          <Box>
                            <Text fontWeight='medium' color='fg'>
                              {org.ent_name}
                            </Text>
                            <Text fontSize='sm' color='fg.secondary'>
                              {org.ent_fsid}
                            </Text>
                          </Box>
                          <Badge
                            variant='subtle'
                            colorPalette={
                              org.user_relationships[0] === 'admin'
                                ? 'red'
                                : 'blue'
                            }
                          >
                            {org.user_relationships[0]
                              ?.charAt(0)
                              .toUpperCase() +
                              org.user_relationships[0]?.slice(1)}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}

                {relationships.teams.length > 0 && (
                  <Box>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg.secondary'
                      mb={2}
                    >
                      Teams
                    </Text>
                    <VStack gap={2} align='stretch'>
                      {relationships.teams.map((team) => (
                        <HStack
                          key={team._id}
                          justify='space-between'
                          p={3}
                          bg='bg.subtle'
                          borderRadius='md'
                        >
                          <Box>
                            <Text fontWeight='medium' color='fg'>
                              {team.ent_name}
                            </Text>
                            <Text fontSize='sm' color='fg.secondary'>
                              {team.ent_fsid}
                            </Text>
                          </Box>
                          <Badge
                            variant='subtle'
                            colorPalette={
                              team.user_relationships[0] === 'admin'
                                ? 'red'
                                : team.user_relationships[0] === 'editor'
                                ? 'orange'
                                : 'green'
                            }
                          >
                            {team.user_relationships[0]
                              ?.charAt(0)
                              .toUpperCase() +
                              team.user_relationships[0]?.slice(1)}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </ProfileCard>
          )}

        {/* Account Settings */}
        <ProfileCard title='Account Settings' icon={FiMail}>
          <VStack gap={6} align='stretch'>
            <EditableField
              field='email'
              label='Email Address'
              value={user.email}
              placeholder='Enter your email address'
              type='email'
              helper='Email changes are not yet available'
              isEditing={isEditing.email}
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              isUpdating={isUpdating.email}
              onEdit={() => handleEdit('email')}
              onCancel={() => handleCancel('email')}
              onSave={() => handleSave('email')}
              onFormChange={handleFormChange}
            />
          </VStack>
        </ProfileCard>

        {/* Security */}
        <ProfileCard title='Security' icon={FiLock}>
          <VStack gap={6} align='stretch'>
            {/* Password change not available notice */}
            <Alert.Root status='info'>
              <Alert.Description>
                Password change functionality is not yet implemented. Please
                contact support if you need to change your password.
              </Alert.Description>
            </Alert.Root>

            {isEditing.password ? (
              <VStack gap={4} align='stretch'>
                <PasswordField
                  field='current'
                  label='Current Password'
                  placeholder='Enter your current password'
                  formData={formData}
                  errors={errors}
                  showPassword={showPassword.current}
                  onFormChange={handleFormChange}
                  onTogglePassword={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      current: !prev.current,
                    }))
                  }
                />

                <PasswordField
                  field='new'
                  label='New Password'
                  placeholder='Enter a new password (min 8 characters)'
                  formData={formData}
                  errors={errors}
                  showPassword={showPassword.new}
                  onFormChange={handleFormChange}
                  onTogglePassword={() =>
                    setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                  }
                />

                <PasswordField
                  field='confirm'
                  label='Confirm New Password'
                  placeholder='Confirm your new password'
                  formData={formData}
                  errors={errors}
                  showPassword={showPassword.confirm}
                  onFormChange={handleFormChange}
                  onTogglePassword={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                />

                <HStack gap={2}>
                  <Button
                    variant='solid'
                    onClick={() => handleSave('password')}
                    loading={isLoading}
                    disabled={true}
                  >
                    <FiSave size={16} color='white' />
                    Update Password (Not Available)
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleCancel('password')}
                    color='fg'
                  >
                    <FiX size={16} color='currentColor' />
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <HStack justify='space-between'>
                <Box>
                  <Text color='fg.secondary' fontSize='sm' mb={1}>
                    Password
                  </Text>
                  <Text color='fg'>••••••••••••</Text>
                </Box>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleEdit('password')}
                  disabled={true}
                >
                  <FiEdit2 size={16} color='currentColor' />
                  Change Password (Not Available)
                </Button>
              </HStack>
            )}
          </VStack>
        </ProfileCard>

        {/* Account Information */}
        <ProfileCard title='Account Information' icon={FiCalendar}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field.Root>
              <Field.Label color='fg.secondary'>User ID</Field.Label>
              <Text color='fg' fontFamily='mono' fontSize='sm'>
                {user._id}
              </Text>
            </Field.Root>

            <Field.Root>
              <Field.Label color='fg.secondary'>Unique ID</Field.Label>
              <Text color='fg' fontFamily='mono' fontSize='sm'>
                {user.uniqueID}
              </Text>
            </Field.Root>

            <Field.Root>
              <Field.Label color='fg.secondary'>Member Since</Field.Label>
              <Text color='fg'>{formatDate(user.createdAt)}</Text>
            </Field.Root>

            <Field.Root>
              <Field.Label color='fg.secondary'>Last Updated</Field.Label>
              <Text color='fg'>{formatDate(user.updatedAt)}</Text>
            </Field.Root>

            <Field.Root>
              <Field.Label color='fg.secondary'>Status</Field.Label>
              <Text color='fg'>{user.status}</Text>
            </Field.Root>

            {relationships && (
              <Field.Root>
                <Field.Label color='fg.secondary'>
                  Total Relationships
                </Field.Label>
                <Text color='fg'>{relationships.total_relationships}</Text>
              </Field.Root>
            )}
          </SimpleGrid>
        </ProfileCard>
      </VStack>

      {/* Toast Display */}
      <ToastDisplay
        toasts={toasts}
        onRemove={removeToast}
        onUndo={executeUndo}
      />
    </Container>
  );
};

export default Profile;
