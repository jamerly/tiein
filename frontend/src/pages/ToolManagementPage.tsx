import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Alert, TablePagination,
  MenuItem,
  FormControlLabel,
  Switch,

} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import { fetchGroups } from '../services/group';
import { v4 as uuidv4 } from 'uuid';
import type { Tool, Parameter } from '../services/tools';
import { fetchTools,createTool,updateTool,deleteTool } from '../services/tools';
import workerService, { type Worker } from '../services/worker';


const ToolManagementPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool | null>(null);
  
  

  const [availableGroups, setAvailableGroups] = useState<{ id: number; name: string }[]>([]); // New state for available groups
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]); // New state for available workers
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | undefined>(undefined); // New state for selected worker ID
  const [loadingWorkers, setLoadingWorkers] = useState(false); // New state for loading workers
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'HTTP' | 'GROOVY'>('HTTP');
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined); // New state for selected group ID
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [httpUrl, setHttpUrl] = useState('');
  const [httpHeadersKv, setHttpHeadersKv] = useState<Array<{ key: string; value: string }>>([]);
  const [httpBody, setHttpBody] = useState('');
  const [groovyScript, setGroovyScript] = useState('');
  const [description, setDescription] = useState('');
  const [inputParameters, setInputParameters] = useState<Parameter[]>([]);
  const [outputParameters, setOutputParameters] = useState<Parameter[]>([]);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [inputSchemaMode, setInputSchemaMode] = useState<'form' | 'json'>('form');
  const [outputSchemaMode, setOutputSchemaMode] = useState<'form' | 'json'>('form');
  const [inputSchemaJsonRaw, setInputSchemaJsonRaw] = useState('');
  const [outputSchemaJsonRaw, setOutputSchemaJsonRaw] = useState('');

  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [helpDialogTitle, setHelpDialogTitle] = useState('');
  const [helpDialogContent, setHelpDialogContent] = useState('');

  const [isProxy, setIsProxy] = useState(false); // State for isProxy

  // Helper to convert JSON Schema to Parameter[]
  const jsonSchemaToParameters = (schemaJson?: string): Parameter[] => {
    if (!schemaJson) return [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
    try {
      const schema = JSON.parse(schemaJson);
      if (schema.type !== 'object' || !schema.properties) {
        console.warn("Schema is not a valid object schema:", schema);
        return [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
      }
      const parameters: Parameter[] = [];
      const required = new Set(schema.required || []);

      for (const key in schema.properties) {
        const prop = schema.properties[key];
        parameters.push({
          id: uuidv4(),
          name: key,
          type: prop.type || 'string',
          description: prop.description || '',
          required: required.has(key),
          defaultValue: prop.default !== undefined ? String(prop.default) : undefined,
          enum: prop.enum ? prop.enum.join(', ') : undefined,
        });
      }
      return parameters.length > 0 ? parameters : [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
    } catch (e) {
      console.error("Failed to parse JSON schema:", e);
      return [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
    }
  };

  // Helper to convert Parameter[] to JSON Schema
  const parametersToJsonSchema = (parameters: Parameter[]): string | undefined => {
    const properties: { [key: string]: any } = {};
    const required: string[] = [];

    parameters.forEach(param => {
      if (param.name.trim() === '') return; // Skip empty parameter names

      properties[param.name] = {
        type: param.type,
        description: param.description,
      };
      if (param.defaultValue !== undefined && param.defaultValue !== '') {
        // Attempt to parse default value based on type
        let parsedDefault: any = param.defaultValue;
        if (param.type === 'integer') parsedDefault = parseInt(String(param.defaultValue));
        else if (param.type === 'boolean') parsedDefault = (String(param.defaultValue).toLowerCase() === 'true');
        // Add more type handling if needed
        properties[param.name].default = parsedDefault;
      }
      if (param.enum && param.enum.trim() !== '') {
        properties[param.name].enum = param.enum.split(',').map(s => s.trim());
      }
      if (param.required) {
        required.push(param.name);
      }
    });

    if (Object.keys(properties).length === 0) {
      return undefined; // No parameters, return undefined schema
    }

    const schema = {
      type: 'object',
      properties: properties,
      required: required,
    };
    return JSON.stringify(schema, null, 2);
  };

  const handleOpenHelpDialog = (title: string, content: string) => {
    setHelpDialogTitle(title);
    setHelpDialogContent(content);
    setOpenHelpDialog(true);
  };

  const handleCloseHelpDialog = () => {
    setOpenHelpDialog(false);
    setHelpDialogTitle('');
    setHelpDialogContent('');
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...httpHeadersKv];
    newHeaders[index][field] = value;
    setHttpHeadersKv(newHeaders);
  };

  const handleAddHeader = () => {
    setHttpHeadersKv([...httpHeadersKv, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = [...httpHeadersKv];
    newHeaders.splice(index, 1);
    setHttpHeadersKv(newHeaders);
  };

  const handleParameterChange = (index: number, updatedParam: Parameter, schemaType: 'input' | 'output') => {
    if (schemaType === 'input') {
      const newParams = [...inputParameters];
      newParams[index] = updatedParam;
      setInputParameters(newParams);
    } else {
      const newParams = [...outputParameters];
      newParams[index] = updatedParam;
      setOutputParameters(newParams);
    }
  };

  const handleAddParameter = (schemaType: 'input' | 'output') => {
    const newParam: Parameter = { id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' };
    if (schemaType === 'input') {
      setInputParameters([...inputParameters, newParam]);
    } else {
      setOutputParameters([...outputParameters, newParam]);
    }
  };

  const handleRemoveParameter = (index: number, schemaType: 'input' | 'output') => {
    if (schemaType === 'input') {
      const newParams = [...inputParameters];
      newParams.splice(index, 1);
      setInputParameters(newParams);
    } else {
      const newParams = [...outputParameters];
      newParams.splice(index, 1);
      setOutputParameters(newParams);
    }
  };

  const handleToggleSchemaMode = (schemaType: 'input' | 'output') => {
    if (schemaType === 'input') {
      if (inputSchemaMode === 'form') {
        // Switching to JSON mode: convert current parameters to JSON
        const json = parametersToJsonSchema(inputParameters);
        setInputSchemaJsonRaw(json || '');
        setInputSchemaMode('json');
      } else {
        // Switching to Form mode: convert current JSON to parameters
        try {
          const params = jsonSchemaToParameters(inputSchemaJsonRaw);
          setInputParameters(params);
          setInputSchemaMode('form');
        } catch (e) {
          setDialogError('Invalid JSON. Cannot switch to form mode.');
        }
      }
    } else {
      if (outputSchemaMode === 'form') {
        // Switching to JSON mode: convert current parameters to JSON
        const json = parametersToJsonSchema(outputParameters);
        setOutputSchemaJsonRaw(json || '');
        setOutputSchemaMode('json');
      } else {
        // Switching to Form mode: convert current JSON to parameters
        try {
          const params = jsonSchemaToParameters(outputSchemaJsonRaw);
          setOutputParameters(params);
          setOutputSchemaMode('form');
        } catch (e) {
          setDialogError('Invalid JSON. Cannot switch to form mode.');
        }
      }
    }
  };

  const _fetchTools = async (pageNumber: number, pageSize: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTools(pageNumber, pageSize);
      setTools(response.content || []);
      setTotalElements(response.totalElements  || 0);
      setPage(response.number); // Update page state based on actual response page number
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch tools.');
      console.error('Fetch tools error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      const response = await fetchGroups();
      setAvailableGroups(response.content || []);
    } catch (err) {
      console.error('Failed to fetch available groups:', err);
    }
  };

  const fetchAvailableWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const response = await workerService.getAllWorkers(0, 1000); // Fetch all workers, assuming max 1000 for now
      console.log('Fetched workers response:', response);
      setAvailableWorkers(response.content || []);
    } catch (err) {
      console.error('Failed to fetch available workers:', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  useEffect(() => {
    _fetchTools(page, rowsPerPage);
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchAvailableGroups();
    fetchAvailableWorkers(); // Fetch available workers
  }, []);

  const handleOpenDialog = (tool: Tool | null = null) => {
    setCurrentTool(tool);
    setName(tool ? tool.name : '');
    setType(tool ? tool.type : 'HTTP');
    setHttpMethod(tool && tool.httpMethod ? tool.httpMethod : 'GET');
    setHttpUrl(tool && tool.httpUrl ? tool.httpUrl : '');
    
    // Initialize httpHeadersKv
    if (tool && tool.httpHeaders) {
      try {
        const parsedHeaders = JSON.parse(tool.httpHeaders);
        const kvHeaders = Object.entries(parsedHeaders).map(([key, value]) => ({ key, value: String(value) }));
        setHttpHeadersKv(kvHeaders.length > 0 ? kvHeaders : [{ key: '', value: '' }]);
      } catch (e) {
        console.error("Failed to parse httpHeaders JSON:", e);
        setHttpHeadersKv([{ key: '', value: '' }]);
      }
    } else {
      setHttpHeadersKv([{ key: '', value: '' }]);
    }

    setHttpBody(tool && tool.httpBody ? tool.httpBody : '');
    setGroovyScript(tool && tool.groovyScript ? tool.groovyScript : '');
    setDescription(tool?.description ?? '');
    // Set group name based on tool.groupId
    setSelectedGroupId(tool?.groupId);
    // Set selected worker ID
    setSelectedWorkerId(tool?.workerId);
    setInputParameters(jsonSchemaToParameters(tool?.inputSchemaJson));
    setOutputParameters(jsonSchemaToParameters(tool?.outputSchemaJson));
    setInputSchemaJsonRaw(tool?.inputSchemaJson || '');
    setOutputSchemaJsonRaw(tool?.outputSchemaJson || '');
    setInputSchemaMode('form'); // Default to form mode
    setOutputSchemaMode('form'); // Default to form mode
    setIsProxy(tool?.isProxy || false); // Initialize isProxy state
    setDialogError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTool(null);
    setName('');
    setType('HTTP');
    setHttpMethod('GET');
    setHttpUrl('');
    setHttpHeadersKv([{ key: '', value: '' }]); // Clear httpHeadersKv
    setHttpBody('');
    setGroovyScript('');
    setDescription('');
    setSelectedGroupId(undefined); // Clear selected group ID
    setInputParameters([{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }]);
    setOutputParameters([{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }]);
    setInputSchemaJsonRaw('');
    setOutputSchemaJsonRaw('');
    setInputSchemaMode('form');
    setOutputSchemaMode('form');
    setIsProxy(false); // Clear isProxy state
    setSelectedWorkerId(undefined); // Clear selected worker ID
    setDialogError(null);
  };

  const handleSubmit = async () => {
    setDialogError(null);
    try {
      // Determine final inputSchemaJson and outputSchemaJson based on mode
      let finalInputSchemaJson: string | undefined;
      if (inputSchemaMode === 'form') {
        finalInputSchemaJson = parametersToJsonSchema(inputParameters);
      } else {
        try {
          // Validate raw JSON before submission
          if (inputSchemaJsonRaw) JSON.parse(inputSchemaJsonRaw);
          finalInputSchemaJson = inputSchemaJsonRaw || undefined;
        } catch (e) {
          setDialogError('Input Schema (JSON) is not valid JSON.');
          return;
        }
      }

      let finalOutputSchemaJson: string | undefined;
      if (outputSchemaMode === 'form') {
        finalOutputSchemaJson = parametersToJsonSchema(outputParameters);
      } else {
        try {
          // Validate raw JSON before submission
          if (outputSchemaJsonRaw) JSON.parse(outputSchemaJsonRaw);
          finalOutputSchemaJson = outputSchemaJsonRaw || undefined;
        } catch (e) {
          setDialogError('Output Schema (JSON) is not valid JSON.');
          return;
        }
      }

      // Convert httpHeadersKv to JSON string
      const headersObject = httpHeadersKv.reduce((acc, curr) => {
        if (curr.key.trim() !== '') {
          acc[curr.key] = curr.value;
        }
        return acc;
      }, {} as Record<string, string>);
      const finalHttpHeaders = Object.keys(headersObject).length > 0 ? JSON.stringify(headersObject) : undefined;

      // Find the selected group's ID from availableGroups
      const finalGroupId = selectedGroupId; // Directly use selectedGroupId

      const toolData = {
        name, type, description, 
        inputSchemaJson: finalInputSchemaJson,
        outputSchemaJson: finalOutputSchemaJson,
        httpMethod: type === 'HTTP' ? httpMethod : undefined,
        httpUrl: type === 'HTTP' ? httpUrl : undefined,
        httpHeaders: type === 'HTTP' ? finalHttpHeaders : undefined,
        httpBody: type === 'HTTP' ? httpBody : undefined,
        groovyScript: type === 'GROOVY' ? groovyScript : undefined,
        isProxy: isProxy, // Include isProxy in toolData
        groupId: finalGroupId, // Include groupId
        workerId: type === 'GROOVY' ? selectedWorkerId : undefined, // Include workerId if type is GROOVY
      } as Tool;

      if (currentTool) {
        // Update tool
        await updateTool(currentTool.id, toolData );
      } else {
        // Create tool
        await createTool(toolData);
      }
      setPage(0); // Reset to first page after add/update
      _fetchTools(page, rowsPerPage);
      handleCloseDialog();
    } catch (err: unknown) {
      setDialogError((err as Error).message || 'Operation failed.');
      console.error('Tool operation error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      try {
        await deleteTool(id); // Use new deleteTool function
        setPage(0); // Reset to first page after delete
        _fetchTools(page, rowsPerPage);
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to delete tool.');
        console.error('Delete tool error:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Tools...</Typography>
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
        Tool Management
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<AddIcon />} 
        onClick={() => handleOpenDialog()} 
        sx={{ mb: 2 }}
      >
        Add Tool
      </Button>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650, width: '100%' }} aria-label="tool table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Proxy</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell component="th" scope="row">
                  {tool.id}
                </TableCell>
                <TableCell>{tool.name}</TableCell>
                <TableCell>{tool.group?.name || 'N/A'}</TableCell>
                <TableCell>{tool.httpUrl || 'N/A'}</TableCell>
                <TableCell>{tool.isProxy ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => handleOpenDialog(tool)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(tool.id)}>
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
          setPage(0); // Reset to first page when rows per page changes
        }}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{currentTool ? 'Edit Tool' : 'Add Tool'}</DialogTitle>
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
            id="group"
            label="Group"
            select
            fullWidth
            variant="standard"
            value={selectedGroupId || ''} // Use selectedGroupId, default to empty string
            onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : undefined)} // Convert to number or undefined
            sx={{ mb: 2 }}
          >
            {availableGroups.map((group) => (
              <MenuItem key={group.id} value={group.id}> {/* Use group.id as value */}
                {group.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ mb: 2 , display: 'flex', flexDirection: 'row', gap: 1 }}>
            <TextField
                  margin="dense"
                  id="type"
                  label="Type"
                  select
                  variant="standard"
                  sx={{ width: 100 }}
                  value={type}
                  onChange={(e) => setType(e.target.value as 'HTTP' | 'GROOVY')}
                >
                  <MenuItem value="HTTP">HTTP</MenuItem>
                  <MenuItem value="GROOVY">GROOVY</MenuItem>
            </TextField>
            <TextField
                    margin="dense"
                    id="httpMethod"
                    label="HTTP Method"
                    select
                    sx={{ width: 100 }}
                    variant="standard"
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE')}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
            </TextField>
            {type === 'HTTP' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isProxy}
                        onChange={(e) => setIsProxy(e.target.checked)}
                        name="isProxy"
                        color="primary"
                        sx={{ flex: 1 }}
                      />
                    }
                    label="Requires Proxy"
                  />
              )}
          </Box>
          {type === 'HTTP' && (
            <>
              <TextField
                margin="dense"
                id="httpUrl"
                label="HTTP URL"
                type="url"
                fullWidth
                variant="standard"
                value={httpUrl}
                onChange={(e) => setHttpUrl(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>HTTP Headers (Key-Value)</Typography>
                {httpHeadersKv.map((header, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      margin="dense"
                      label="Key"
                      variant="standard"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      margin="dense"
                      label="Value"
                      variant="standard"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <IconButton onClick={() => handleRemoveHeader(index)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button onClick={handleAddHeader} startIcon={<AddIcon />} size="small">
                  Add Header
                </Button>
              </Box>
            </>
          )}
          {type === 'GROOVY' && (
            <TextField
              margin="dense"
              id="worker"
              label="Worker Script"
              select
              fullWidth
              variant="standard"
              value={selectedWorkerId || ''} // Ensure value is always a number or empty string
              onChange={(e) => setSelectedWorkerId(e.target.value ? Number(e.target.value) : undefined)}
              sx={{ mb: 2 }}
              SelectProps={{
                displayEmpty: true,
              }}
            >
              {loadingWorkers ? (
                <MenuItem disabled>Loading workers...</MenuItem>
              ) : availableWorkers.length === 0 ? (
                <MenuItem disabled>No workers available</MenuItem>
              ) : (
                availableWorkers.map((worker) => (
                  <MenuItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          )}
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Input Schema Parameters
              <IconButton
                onClick={() => handleOpenHelpDialog(
                  "Input Schema Parameters Help",
                  "Define the input parameters for your tool using JSON Schema. These parameters will be used to generate the input form for your tool."
                )}
                size="small"
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
              <Button onClick={() => handleToggleSchemaMode('input')} size="small" sx={{ ml: 1 }}>
                {inputSchemaMode === 'form' ? 'Edit JSON' : 'Edit Form'}
              </Button>
            </Typography>
            {inputSchemaMode === 'form' ? (
              <>
                {inputParameters.map((param, index) => (
                  <ParameterRow
                    key={param.id}
                    parameter={param}
                    onChange={(updatedParam) => handleParameterChange(index, updatedParam, 'input')}
                    onRemove={() => handleRemoveParameter(index, 'input')}
                  />
                ))}
                <Button onClick={() => handleAddParameter('input')} startIcon={<AddIcon />} size="small">
                  Add Input Parameter
                </Button>
              </>
            ) : (
              <TextField
                margin="dense"
                id="inputSchemaJsonRaw"
                label="Input Schema (JSON)"
                type="text"
                fullWidth
                multiline
                rows={10}
                variant="standard"
                value={inputSchemaJsonRaw}
                onChange={(e) => setInputSchemaJsonRaw(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Output Schema Parameters
              <IconButton
                onClick={() => handleOpenHelpDialog(
                  'Output Schema Parameters Help',
                  `Define the expected output structure of the tool using JSON Schema. Each parameter has a name, type, and description.

Example JSON Schema for output parameters:
{
  "type": "object",
  "properties": {
    "temperature": {
      "type": "integer",
      "description": "The current temperature"
    },
    "unit": {
      "type": "string",
      "description": "The unit of temperature"
    }
  }
}`
                )}
                size="small"
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
              <Button onClick={() => handleToggleSchemaMode('output')} size="small" sx={{ ml: 1 }}>
                {outputSchemaMode === 'form' ? 'Edit JSON' : 'Edit Form'}
              </Button>
            </Typography>
            {outputSchemaMode === 'form' ? (
              <>
                {outputParameters.map((param, index) => (
                  <ParameterRow
                    key={param.id}
                    parameter={param}
                    onChange={(updatedParam) => handleParameterChange(index, updatedParam, 'output')}
                    onRemove={() => handleRemoveParameter(index, 'output')}
                  />
                ))}
                <Button onClick={() => handleAddParameter('output')} startIcon={<AddIcon />} size="small">
                  Add Output Parameter
                </Button>
              </>
            ) : (
              <TextField
                margin="dense"
                id="outputSchemaJsonRaw"
                label="Output Schema (JSON)"
                type="text"
                fullWidth
                multiline
                rows={10}
                variant="standard"
                value={outputSchemaJsonRaw}
                onChange={(e) => setOutputSchemaJsonRaw(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{currentTool ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openHelpDialog} onClose={handleCloseHelpDialog} maxWidth="md" fullWidth>
        <DialogTitle>{helpDialogTitle}</DialogTitle>
        <DialogContent>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {helpDialogContent}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface ParameterRowProps {
  parameter: Parameter;
  onChange: (parameter: Parameter) => void;
  onRemove: () => void;
}

const ParameterRow: React.FC<ParameterRowProps> = ({ parameter, onChange, onRemove }) => {
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as Parameter['type'];
    onChange({ ...parameter, type: newType, defaultValue: undefined, enum: undefined });
  };

  const handleDefaultValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: string | number | boolean = e.target.value;
    if (parameter.type === 'integer') value = parseInt(value as string);
    else if (parameter.type === 'boolean') value = (value as string).toLowerCase() === 'true';
    onChange({ ...parameter, defaultValue: value });
  };

  

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
      <TextField
        margin="dense"
        label="Name"
        variant="standard"
        value={parameter.name}
        onChange={(e) => onChange({ ...parameter, name: e.target.value })}
        sx={{ flex: 1 }}
      />
      <TextField
        margin="dense"
        label="Type"
        select
        variant="standard"
        value={parameter.type}
        onChange={handleTypeChange}
        sx={{ flex: 0.5 }}
      >
        <MenuItem value="string">string</MenuItem>
        <MenuItem value="integer">integer</MenuItem>
        <MenuItem value="boolean">boolean</MenuItem>
        <MenuItem value="array">array</MenuItem>
        <MenuItem value="object">object</MenuItem>
      </TextField>
      <TextField
        margin="dense"
        label="Description"
        variant="standard"
        value={parameter.description}
        onChange={(e) => onChange({ ...parameter, description: e.target.value })}
        sx={{ flex: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={parameter.required}
            onChange={(e) => onChange({ ...parameter, required: e.target.checked })}
            name="required"
          />
        }
        label="Required"
        sx={{ flex: 0.5 }}
      />
      {(parameter.type === 'string' || parameter.type === 'integer' || parameter.type === 'boolean') && (
        <TextField
          margin="dense"
          label="Default Value"
          variant="standard"
          value={parameter.defaultValue !== undefined ? String(parameter.defaultValue) : ''}
          onChange={handleDefaultValueChange}
          sx={{ flex: 0.8 }}
        />
      )}
      {parameter.type === 'string' && (
        <TextField
          margin="dense"
          label="Enum (comma-separated)"
          variant="standard"
          value={parameter.enum || ''}
          onChange={(e) => onChange({ ...parameter, enum: e.target.value })}
          sx={{ flex: 1 }}
        />
      )}
      <IconButton onClick={onRemove} size="small">
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

export default ToolManagementPage;