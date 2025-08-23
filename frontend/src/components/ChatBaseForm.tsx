import React, { useState, useEffect } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Button, OutlinedInput, Switch, Typography } from '@mui/material';
import { type Group } from '../services/group';
import { type ChatBaseInstance, type CreateChatBasePayload } from '../services/chatbase';

interface ChatBaseFormProps {
  isEdit: boolean;
  initialData?: ChatBaseInstance;
  onSubmit: (payload: CreateChatBasePayload) => void;
  availableGroups: Group[];
}

const ChatBaseForm: React.FC<ChatBaseFormProps> = ({ isEdit, initialData, onSubmit, availableGroups }) => {
  const [name, setName] = useState('');
  const [rolePrompt, setRolePrompt] = useState('');
  const [greeting, setGreeting] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [requireAuth, setRequireAuth] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.name);
      setRolePrompt(initialData.rolePrompt);
      setGreeting(initialData.greeting);
      setSelectedGroups(initialData.groupIds);
      setRequireAuth(initialData.requireAuth || false);
      setAuthUrl(initialData.authUrl || '');
    }
  }, [isEdit, initialData]);

  const handleGroupChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setSelectedGroups(
      typeof value === 'string' ? value.split(',').map(Number) : value,
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: CreateChatBasePayload = {
      name,
      rolePrompt,
      greeting,
      groupIds: selectedGroups,
      requireAuth,
      authUrl: requireAuth ? authUrl : '',
    };
    onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        variant="outlined"
        fullWidth
        required
      />
      <TextField
        label="Role Prompt"
        multiline
        rows={6}
        value={rolePrompt}
        onChange={(e) => setRolePrompt(e.target.value)}
        variant="outlined"
        fullWidth
        required
      />
      <TextField
        label="Greeting"
        multiline
        rows={3}
        value={greeting}
        onChange={(e) => setGreeting(e.target.value)}
        variant="outlined"
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel id="select-groups-label">Tool Groups</InputLabel>
        <Select
          labelId="select-groups-label"
          id="select-groups"
          multiple
          value={selectedGroups}
          onChange={handleGroupChange}
          input={<OutlinedInput label="Tool Groups" />}
          renderValue={(selected) => {
            const selectedNames = availableGroups
              .filter(group => selected.includes(group.id))
              .map(group => group.name);
            return selectedNames.join(', ');
          }}
        >
          {availableGroups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              <Checkbox checked={selectedGroups.indexOf(group.id) > -1} />
              <ListItemText primary={group.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl component="fieldset">
        <Typography component="legend">Require Authentication</Typography>
        <Switch
          checked={requireAuth}
          onChange={(e) => setRequireAuth(e.target.checked)}
        />
      </FormControl>
      {requireAuth && (
        <TextField
          label="Auth URL"
          value={authUrl}
          onChange={(e) => setAuthUrl(e.target.value)}
          variant="outlined"
          fullWidth
          required
          helperText={
            <>
              <div>When authentication is required, the user will be redirected to this URL.</div>
              <div>After successful login, the target service should return a token.</div>
              <div>The frontend will then use this token to make authenticated requests to the chat service by adding an 'Authorization: Bearer &lt;token&gt;' header.</div>
              <div>Example: <code>Authorization: Bearer &lt;your_token&gt;</code></div>
            </>
          }
        />
      )}
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        {isEdit ? 'Save Changes' : 'Create ChatBase'}
      </Button>
    </Box>
  );
};

export default ChatBaseForm;