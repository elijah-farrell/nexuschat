import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Switch, TextField, Button, Box, Divider, CircularProgress, DialogActions, DialogContentText, Dialog as MuiDialog
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { useAuth, useLogoutWithSocket } from "../../contexts/AuthContext";
import PropTypes from 'prop-types';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const Settings = ({ open, onClose, onThemeToggle, themeMode }) => {
  const { user, token, setUser } = useAuth();
  const logoutWithSocket = useLogoutWithSocket();
  const theme = useTheme();

  // Username state
  const [username, setUsername] = useState(user?.username || "");
  const [usernameError, setUsernameError] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Handle username change
  const handleUsernameInput = (e) => {
    setUsername(e.target.value);
    setUsernameError("");
    setUsernameSuccess(false);
  };

  const checkUsername = async (value) => {
    if (!USERNAME_REGEX.test(value)) {
      setUsernameError("Username must be 3-20 characters, letters, numbers, or underscores.");
      return false;
    }
    setUsernameLoading(true);
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!data.available) {
        setUsernameError("Username is already taken.");
        setUsernameLoading(false);
        return false;
      }
      setUsernameError("");
      setUsernameLoading(false);
      return true;
    } catch {
      setUsernameError("Error checking username.");
      setUsernameLoading(false);
      return false;
    }
  };

  // Save username
  const handleSaveUsername = async () => {
    if (username === user.username || usernameError) return;
    const valid = await checkUsername(username);
    if (!valid) return;
    setUsernameLoading(true);
    try {
      const res = await fetch("/api/auth/update-username", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        setUser({ ...user, username });
        setUsernameSuccess(true);
      } else {
        setUsernameError("Failed to update username.");
      }
    } catch {
      setUsernameError("Network error.");
    }
    setUsernameLoading(false);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      setDeleting(false);
      if (res.ok) {
        await logoutWithSocket();
        window.location.href = "/login";
      } else {
        alert("Failed to delete account.");
      }
    } catch {
      setDeleting(false);
      alert("Network error.");
    }
  };

  return (
          <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Settings
        <IconButton
          onClick={onClose}
          autoFocus
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Appearance */}
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Appearance
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography>Dark Mode</Typography>
          <Switch checked={themeMode === "dark"} onChange={onThemeToggle} />
        </Box>
        <Divider sx={{ my: 2 }} />

        {/* Username */}
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Username
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TextField
            value={username}
            onChange={handleUsernameInput}
            onBlur={() => checkUsername(username)}
            error={!!usernameError}
            helperText={usernameError || (usernameSuccess ? "Username updated!" : "")}
            size="small"
            disabled={usernameLoading}
            inputProps={{ maxLength: 20 }}
          />
          <Button
            onClick={handleSaveUsername}
            disabled={username === user.username || !!usernameError || usernameLoading || !username}
            variant="contained"
          >
            {usernameLoading ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />

        {/* Delete Account */}
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Danger Zone
        </Typography>
        <Button
          color="error"
          variant="outlined"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete My Account
        </Button>
        <MuiDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? <CircularProgress size={20} /> : "Delete"}
            </Button>
          </DialogActions>
        </MuiDialog>
      </DialogContent>
    </Dialog>
  );
};

Settings.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onThemeToggle: PropTypes.func.isRequired,
  themeMode: PropTypes.string.isRequired,
};

export default Settings; 