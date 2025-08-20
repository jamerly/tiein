import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Alert, TablePagination,

} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { fetchGroups, createGroup, updateGroup, deleteGroup } from '../services/group';
import type { Group } from '../services/group';

const GroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  

  

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchGroups(page, rowsPerPage);
      setGroups(response.content);
      setTotalElements(response.totalElements);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch groups.');
      console.error('Fetch groups error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [page, rowsPerPage]);

  const handleOpenDialog = (group: Group | null = null) => {
    setCurrentGroup(group);
    setGroupName(group ? group.name : '');
    setDialogError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentGroup(null);
    setGroupName('');
    setDialogError(null);
  };

  const handleSubmit = async () => {
    setDialogError(null);
    if (!groupName.trim()) {
      setDialogError('Group name cannot be empty.');
      return;
    }

    try {
      if (currentGroup) {
        // Update group
        await updateGroup(currentGroup.id, groupName); // Use new updateGroup function
      } else {
        // Create group
        await createGroup(groupName); // Use new createGroup function
      }
      loadGroups(); // Refresh list
      handleCloseDialog();
    } catch (err: unknown) {
      setDialogError((err as Error).message || 'Operation failed.');
      console.error('Group operation error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteGroup(id); // Use new deleteGroup function
        loadGroups(); // Refresh list
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to delete group.');
        console.error('Delete group error:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Groups...</Typography>
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
        Group Management
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mb: 2 }}
      >
        Add Group
      </Button>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 400 }} aria-label="group table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell component="th" scope="row">
                  {group.id}
                </TableCell>
                <TableCell>{group.name}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => handleOpenDialog(group)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(group.id)}>
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalElements}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 20));
          setPage(0); // Reset to first page when rows per page changes
        }}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{currentGroup ? 'Edit Group' : 'Add Group'}</DialogTitle>
        <DialogContent>
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Group Name"
            type="text"
            fullWidth
            variant="standard"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{currentGroup ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupManagementPage;