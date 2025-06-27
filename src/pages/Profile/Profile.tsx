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
  Alert,
  Container,
  SimpleGrid,
  Spinner,
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
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
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
  const { user, workspace } = useAuth();
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
    email: user?.email || 'carlton@example.com', // Mock email since every user has one
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

  // Early return after all hooks are declared
  if (!user) {
    return (
      <Container maxW='4xl' py={8}>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='center'
          minH='200px'
        >
          <VStack gap={4}>
            <Spinner size='xl' color='brand.500' />
            <Text>Loading profile...</Text>
          </VStack>
        </Box>
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

        // TODO: Replace with actual API call
        // const response = await userService.changePassword({
        //   currentPassword: formData.currentPassword,
        //   newPassword: formData.newPassword
        // });

        // Simulate API call for password change
        await new Promise((resolve) => setTimeout(resolve, 1000));

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
        // TODO: Replace with actual API call
        // const response = await userService.updateProfile(updateData);

        // Simulate API call for profile update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast({
          title: 'Profile updated',
          description: `Your ${field} has been successfully updated.`,
          status: 'success',
        });
      }

      setIsEditing((prev) => ({ ...prev, [field]: false }));
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update your profile. Please try again.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW='4xl' py={8}>
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
                <IconButton
                  position='absolute'
                  bottom='0'
                  right='0'
                  size='sm'
                  variant='solid'
                  borderRadius='full'
                  aria-label='Upload photo'
                  disabled
                  title='Photo upload coming soon'
                >
                  <FiCamera size={16} />
                </IconButton>
              </Box>
              <VStack align='start' gap={4} flex={1}>
                {/* Editable Full Name */}
                <Field.Root invalid={!!errors.fullname}>
                  {isEditing.fullname ? (
                    <VStack gap={3} align='stretch' width='full'>
                      <Input
                        value={formData.fullname}
                        onChange={(e) =>
                          handleFormChange('fullname', e.target.value)
                        }
                        placeholder='Enter your full name'
                        bg='bg.canvas'
                        fontSize='lg'
                        fontWeight='medium'
                      />
                      <HStack gap={2}>
                        <Button
                          size='sm'
                          variant='solid'
                          onClick={() => handleSave('fullname')}
                          loading={isLoading}
                        >
                          <FiSave size={16} />
                          Save
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleCancel('fullname')}
                        >
                          <FiX size={16} />
                          Cancel
                        </Button>
                      </HStack>
                      {errors.fullname && (
                        <Field.ErrorText>{errors.fullname}</Field.ErrorText>
                      )}
                    </VStack>
                  ) : (
                    <HStack gap={2} align='center' width='full'>
                      <Text
                        fontSize='lg'
                        fontWeight='medium'
                        color='fg'
                        cursor='pointer'
                        onClick={() => handleEdit('fullname')}
                        _hover={{ color: 'brand.500' }}
                      >
                        {user.fullname || 'Set your name'}
                      </Text>
                      <IconButton
                        size='sm'
                        variant='ghost'
                        onClick={() => handleEdit('fullname')}
                        aria-label='Edit name'
                      >
                        <FiEdit2 size={16} />
                      </IconButton>
                    </HStack>
                  )}
                </Field.Root>

                {/* Editable Biography */}
                <Field.Root invalid={!!errors.biography} width='full'>
                  {isEditing.biography ? (
                    <VStack gap={3} align='stretch' width='full'>
                      <Textarea
                        value={formData.biography}
                        onChange={(e) =>
                          handleFormChange('biography', e.target.value)
                        }
                        placeholder='Tell us about yourself...'
                        bg='bg.canvas'
                        rows={3}
                      />
                      <HStack gap={2}>
                        <Button
                          size='sm'
                          variant='solid'
                          onClick={() => handleSave('biography')}
                          loading={isLoading}
                        >
                          <FiSave size={16} />
                          Save
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleCancel('biography')}
                        >
                          <FiX size={16} />
                          Cancel
                        </Button>
                      </HStack>
                      {errors.biography && (
                        <Field.ErrorText>{errors.biography}</Field.ErrorText>
                      )}
                    </VStack>
                  ) : (
                    <HStack gap={2} align='start' width='fit-content'>
                      <Box>
                        {user.biography ? (
                          <Text
                            color='fg.secondary'
                            cursor='pointer'
                            onClick={() => handleEdit('biography')}
                            _hover={{ color: 'fg' }}
                          >
                            {user.biography}
                          </Text>
                        ) : (
                          <Text
                            color='fg.muted'
                            fontStyle='italic'
                            cursor='pointer'
                            onClick={() => handleEdit('biography')}
                            _hover={{ color: 'fg.secondary' }}
                          >
                            Add a biography...
                          </Text>
                        )}
                      </Box>
                      <IconButton
                        size='sm'
                        variant='ghost'
                        onClick={() => handleEdit('biography')}
                        aria-label='Edit biography'
                        alignSelf='flex-start'
                      >
                        <FiEdit2 size={16} />
                      </IconButton>
                    </HStack>
                  )}
                </Field.Root>

                {/* Role Badge */}
                <HStack gap={2}>
                  <Badge variant='subtle' colorPalette='blue'>
                    {workspace?.name || 'Futurity Systems'} • Admin
                  </Badge>
                  {user.email_validated === 1 && (
                    <Badge variant='subtle' colorPalette='green'>
                      Email Verified
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>

            <Alert.Root status='info'>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Photo Upload Coming Soon</Alert.Title>
                <Alert.Description>
                  Profile picture upload functionality will be available in a
                  future update.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          </VStack>
        </ProfileCard>

        {/* Account Settings */}
        <ProfileCard title='Account Settings' icon={FiMail}>
          <VStack gap={6} align='stretch'>
            <EditableField
              field='email'
              label='Email Address'
              value={formData.email}
              placeholder='Enter your email address'
              type='email'
              helper='Email change functionality coming soon'
              isEditing={isEditing.email}
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              onEdit={() => handleEdit('email')}
              onCancel={() => handleCancel('email')}
              onSave={() => handleSave('email')}
              onFormChange={handleFormChange}
            />

            <Alert.Root status='warning'>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Email Change Coming Soon</Alert.Title>
                <Alert.Description>
                  Email verification and change functionality will be available
                  in a future update.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
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
                  placeholder='Enter a new password'
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
