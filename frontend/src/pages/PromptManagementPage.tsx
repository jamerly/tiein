import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../services/api';

interface Prompt {
  id: number;
  name: string;
  content: string;
  description?: string;
  inputSchemaJson?: string;
  outputSchemaJson?: string;
}

const PromptManagementPage: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [inputSchemaJson, setInputSchemaJson] = useState('');
  const [outputSchemaJson, setOutputSchemaJson] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Prompt[]>('/mcp/prompts');
      setPrompts(response);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch prompts.');
      console.error('Fetch prompts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleOpenDialog = (prompt: Prompt | null = null) => {
    setCurrentPrompt(prompt);
    setName(prompt ? prompt.name : '');
    setContent(prompt ? prompt.content : '');
    setDescription(prompt ? prompt.description : '');
    setInputSchemaJson(prompt && prompt.inputSchemaJson ? prompt.inputSchemaJson : '');
    setOutputSchemaJson(prompt && prompt.outputSchemaJson ? prompt.outputSchemaJson : '');
    setDialogError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPrompt(null);
    setName('');
    setContent('');
    setDescription('');
    setInputSchemaJson('');
    setOutputSchemaJson('');
    setDialogError(null);
  };

  const handleSubmit = async () => {
    setDialogError(null);
    try {
      const promptData = {
        name, content, description, inputSchemaJson, outputSchemaJson
      };

      if (currentPrompt) {
        // Update prompt
        await api.put(`/mcp/prompts/${currentPrompt.id}`, { id: currentPrompt.id, ...promptData });
      } else {
        // Create prompt
        await api.post('/mcp/prompts', promptData);
      }
      fetchPrompts();
      handleCloseDialog();
    } catch (err: unknown) {
      setDialogError((err as Error).message || 'Operation failed.');
      console.error('Prompt operation error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await api.delete(`/mcp/prompts/${id}`);
        fetchPrompts();
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to delete prompt.');
        console.error('Delete prompt error:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Prompts...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Prompt Management
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<AddIcon />} 
        onClick={() => handleOpenDialog()} 
        sx={{ mb: 2 }}
      >
        Add Prompt
      </Button>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="prompt table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell component="th" scope="row">
                  {prompt.id}
                </TableCell>
                <TableCell>{prompt.name}</TableCell>
                <TableCell>{prompt.description || 'N/A'}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => handleOpenDialog(prompt)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(prompt.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{currentPrompt ? 'Edit Prompt' : 'Add Prompt'}</DialogTitle>
        <DialogContent>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="content"
            label="Content"
            type="text"
            fullWidth
            multiline
            rows={10}
            variant="standard"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="standard"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="inputSchemaJson"
            label="Input Schema (JSON)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="standard"
            value={inputSchemaJson}
            onChange={(e) => setInputSchemaJson(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="outputSchemaJson"
            label="Output Schema (JSON)"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="standard"
            value={outputSchemaJson}
            onChange={(e) => setOutputSchemaJson(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{currentPrompt ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromptManagementPage;