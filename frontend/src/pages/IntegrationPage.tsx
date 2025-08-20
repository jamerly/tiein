import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ToolManagementPage from './ToolManagementPage';
import ResourceManagementPage from './ResourceManagementPage';
import PromptManagementPage from './PromptManagementPage';
import GroupManagementPage from './GroupManagementPage'; // New Import
import WorkerManagementPage from './WorkerManagementPage'; // New Import
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
      style={{ width: '100%' }} // Ensure content takes full width
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

const IntegrationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the initial tab based on the URL hash or default to 'tools'
  const getInitialTab = () => {
    switch (location.hash) {
      case '#resources':
        return 1;
      case '#prompts':
        return 2;
      case '#groups':
        return 3;
      case '#workers':
        return 4;
      case '#tools':
      default:
        return 0;
    }
  };

  const [value, setValue] = useState(getInitialTab());

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    // Update URL hash based on selected tab
    switch (newValue) {
      case 0:
        navigate('#tools');
        break;
      case 1:
        navigate('#resources');
        break;
      case 2:
        navigate('#prompts');
        break;
      case 3:
        navigate('#groups');
        break;
      case 4:
        navigate('#workers');
        break;
      default:
        navigate('#tools');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 'calc(100vh - 64px)' }}> {/* Adjust height based on AppBar */}
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="Integration sub-navigation"
        sx={{ borderRight: 1, borderColor: 'divider', minWidth: '150px' }}
      >
        <Tab label="Tools" icon={<HandymanOutlinedIcon />} {...a11yProps(0)} />
        <Tab label="Resources" icon={<Inventory2OutlinedIcon />} {...a11yProps(1)} />
        <Tab label="Prompts" icon={<LightbulbOutlinedIcon />} {...a11yProps(2)} />
        <Tab label="Groups" icon={<GroupsOutlinedIcon />} {...a11yProps(3)} />
        <Tab label="Workers" icon={<EngineeringOutlinedIcon />} {...a11yProps(4)} />
      </Tabs>
      <TabPanel value={value} index={0}>
        <ToolManagementPage />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ResourceManagementPage />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <PromptManagementPage />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <GroupManagementPage />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <WorkerManagementPage />
      </TabPanel>
    </Box>
  );
};

export default IntegrationPage;