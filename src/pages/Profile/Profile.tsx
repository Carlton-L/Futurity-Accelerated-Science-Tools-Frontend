import React, { useState } from 'react';
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
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
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
        <Icon size={20} color='var(--chakra-colors-brand-500)' />
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
          />
        ) : (
          <Input
            type={type}
            value={formData[field]}
            onChange={(e) => onFormChange(field, e.target.value)}
            placeholder={placeholder}
            bg='bg.canvas'
          />
        )}
        <HStack gap={2}>
          <Button
            size='sm'
            variant='solid'
            onClick={onSave}
            loading={isLoading}
          >
            <FiSave size={16} />
            Save
          </Button>
          <Button size='sm' variant='outline' onClick={onCancel}>
            <FiX size={16} />
            Cancel
          </Button>
        </HStack>
        {errors[field] && <Field.ErrorText>{errors[field]}</Field.ErrorText>}
      </VStack>
    ) : (
      <HStack gap={2} align='start'>
        <Box flex={1}>
          {value ? (
            <Text color='fg' wordBreak='break-word'>
              {value}
            </Text>
          ) : (
            <Text color='fg.muted' fontStyle='italic'>
              Not provided
            </Text>
          )}
          {helper && <Field.HelperText>{helper}</Field.HelperText>}
        </Box>
        <IconButton
          size='sm'
          variant='ghost'
          onClick={onEdit}
          aria-label={`Edit ${label}`}
          alignSelf='flex-start'
        >
          <FiEdit2 size={16} />
        </IconButton>
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
  const { user, workspace, token, refreshUser } = useAuth();
  const { toast, toasts, removeToast, executeUndo } = useToast();

  // Initialize all hooks first (React hooks rules)
  const [isEditing, setIsEditing] = useState<EditingState>({
    fullname: false,
    biography: false,
    email: false,
    password: false,
  });

  const [formData, setFormData] = useState<FormData>({
    fullname: user?.fullname || '',
    biography: user?.biography || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState<ShowPasswordState>({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [isUploadingPicture, setIsUploadingPicture] = useState<boolean>(false);

  // Early return after all hooks are declared
  if (!user) {
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

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEdit = (field: keyof EditingState): void => {
    setIsEditing((prev) => ({ ...prev, [field]: true }));
    // Reset form data to current user values when starting to edit
    if (field !== 'password') {
      setFormData((prev) => ({
        ...prev,
        [field]: user[field as keyof typeof user] || '',
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
        [field]: user[field as keyof typeof user] || '',
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
    if (!user || !token) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (field === 'password') {
        const passwordErrors = validatePassword();
        if (Object.keys(passwordErrors).length > 0) {
          setErrors(passwordErrors);
          setIsLoading(false);
          return;
        }

        await userService.changePassword(
          user._id,
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
      } else {
        // Profile update
        const updateData: any = {};
        if (field === 'fullname') updateData.fullname = formData.fullname;
        if (field === 'biography') updateData.biography = formData.biography;
        if (field === 'email') updateData.email = formData.email;

        await userService.updateProfile(user._id, updateData, token);

        // Refresh user data in context
        if (refreshUser) {
          await refreshUser();
        }

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
      const result = await userService.uploadProfilePicture(
        user._id,
        profilePictureFile,
        token
      );

      // Refresh user data to get new picture URLs
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Upload failed',
        description: `Failed to upload profile picture: ${errorMessage}`,
        status: 'error',
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
                    src={user.picture_url}
                    alt={user.displayName || user.fullname}
                  />
                  <Avatar.Fallback>
                    {(user.displayName || user.fullname || user.username || 'U')
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
                    <FiCamera size={16} />
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
                      <FiUpload size={16} />
                      Upload
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setProfilePictureFile(null)}
                    >
                      <FiX size={16} />
                      Cancel
                    </Button>
                  </HStack>
                )}

                {/* Editable Full Name */}
                <EditableField
                  field='fullname'
                  label='Full Name'
                  value={user.fullname || ''}
                  placeholder='Enter your full name'
                  isEditing={isEditing.fullname}
                  formData={formData}
                  errors={errors}
                  isLoading={isLoading}
                  onEdit={() => handleEdit('fullname')}
                  onCancel={() => handleCancel('fullname')}
                  onSave={() => handleSave('fullname')}
                  onFormChange={handleFormChange}
                />

                {/* Editable Biography */}
                <EditableField
                  field='biography'
                  label='Biography'
                  value={user.biography || ''}
                  placeholder='Tell us about yourself...'
                  isTextarea={true}
                  isEditing={isEditing.biography}
                  formData={formData}
                  errors={errors}
                  isLoading={isLoading}
                  onEdit={() => handleEdit('biography')}
                  onCancel={() => handleCancel('biography')}
                  onSave={() => handleSave('biography')}
                  onFormChange={handleFormChange}
                />

                {/* Role Badge */}
                <HStack gap={2}>
                  <Badge variant='subtle' colorPalette='blue'>
                    {workspace?.name || 'Futurity Systems'} • {user.role}
                  </Badge>
                  {user.email_validated === 1 && (
                    <Badge variant='subtle' colorPalette='green'>
                      Email Verified
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </ProfileCard>

        {/* Account Settings */}
        <ProfileCard title='Account Settings' icon={FiMail}>
          <VStack gap={6} align='stretch'>
            <EditableField
              field='email'
              label='Email Address'
              value={user.email}
              placeholder='Enter your email address'
              type='email'
              helper='Changes to email will require verification'
              isEditing={isEditing.email}
              formData={formData}
              errors={errors}
              isLoading={isLoading}
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
                  >
                    <FiSave size={16} />
                    Update Password
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => handleCancel('password')}
                  >
                    <FiX size={16} />
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
                >
                  <FiEdit2 size={16} />
                  Change Password
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
              <Field.Label color='fg.secondary'>Username</Field.Label>
              <Text color='fg'>{user.username}</Text>
            </Field.Root>

            <Field.Root>
              <Field.Label color='fg.secondary'>Member Since</Field.Label>
              <Text color='fg'>{formatDate(user.created_at)}</Text>
            </Field.Root>

            <Field.Root>
              <Field.Label color='fg.secondary'>Last Updated</Field.Label>
              <Text color='fg'>{formatDate(user.updated_at)}</Text>
            </Field.Root>
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
