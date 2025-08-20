import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  TablePagination,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import CodeEditor from '../components/CodeEditor';
import workerService, { type Worker } from '../services/worker';

const WorkerManagementPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [script, setScript] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);
  // const [aiPrompt, setAiPrompt] = useState(''); // New state for AI prompt
  // const [isGenerating, setIsGenerating] = useState(false); // New state for AI generation loading

  // Pagination states
  const [page, setPage] = useState(0); // 0-indexed page number
  const [rowsPerPage, setRowsPerPage] = useState(10); // Items per page
  const [totalElements, setTotalElements] = useState(0);

  

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workerService.getAllWorkers(page, rowsPerPage);
      setWorkers(response.content);
      setTotalElements(response.totalElements);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch workers.');
      console.error('Fetch workers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [page, rowsPerPage]);

  const handleOpenDialog = (worker: Worker | null = null) => {
    setCurrentWorker(worker);
    setName(worker ? worker.name : '');
    setScript(worker ? worker.script : '');
    setDialogError(null);
    // setAiPrompt(''); // Clear AI prompt on dialog open
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentWorker(null);
    setName('');
    setScript('');
    setDialogError(null);
    // setAiPrompt('');
  };

  const handleSubmit = async () => {
    setDialogError(null);
    try {
      const workerData: Omit<Worker, 'id'> = {
        name,
        script,
      };

      if (currentWorker) {
        // Update worker
        await workerService.updateWorker({ ...workerData, id: currentWorker.id });
      } else {
        // Create worker
        await workerService.createWorker(workerData);
      }
      setPage(0); // Reset to first page after add/update
      loadWorkers();
      handleCloseDialog();
    } catch (err: unknown) {
      setDialogError((err as Error).message || 'Operation failed.');
      console.error('Worker operation error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await workerService.deleteWorker(id);
        setPage(0); // Reset to first page after delete
        loadWorkers();
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to delete worker.');
        console.error('Delete worker error:', err);
      }
    }
  };

  // const handleGenerateWithAI = async () => {
  //   setDialogError(null);
  //   setIsGenerating(true);
  //   try {
  //     if (!aiPrompt) {
  //       setDialogError('Please enter a prompt for AI generation.');
  //       return;
  //     }
  //     const generatedScript = await workerService.generateWorkerScript(aiPrompt);
  //     setScript(generatedScript);
  //   } catch (err: unknown) {
  //     setDialogError((err as Error).message || 'Failed to generate script with AI.');
  //     console.error('AI generation error:', err);
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Workers...</Typography>
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
        Worker Management
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mb: 2 }}
      >
        Add Worker
      </Button>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650, width: '100%' }} aria-label="worker table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell component="th" scope="row">
                  {worker.id}
                </TableCell>
                <TableCell>{worker.name}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => handleOpenDialog(worker)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(String(worker.id))}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalElements}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{currentWorker ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
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
          {/* <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>AI Prompt</Typography>
            <TextField
              margin="dense"
              id="ai-prompt"
              label="Enter prompt for AI generation"
              type="text"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : null}
            >
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </Button>
          </Box> */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Groovy Script</Typography>
            <CodeEditor
              value={script}
              language="java"
              onChange={(newValue) => setScript(newValue)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{currentWorker ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerManagementPage;
