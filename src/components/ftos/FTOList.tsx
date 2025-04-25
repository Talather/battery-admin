/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  InputAdornment,
  useTheme,
  useMediaQuery,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Tabs,
  Tab,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import EditFTO from "./EditFTO";

interface FTO {
  id: string;
  Atheletes: {
    firstName: string;
    lastName: string;
    tokenSymbol: string;
    profilePicture: string;
  };
  tokensForSale: number;
  purchaseLimit: number;
  roundNumber: number;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  videoUrl: string;
  active: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface Filters {
  roundNumber: number | "";
  tokenRange: [number, number];
  purchaseLimit: [number, number];
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export default function FTOList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [value, setValue] = useState(0);
  const [ftos, setFtos] = useState<FTO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [filters, setFilters] = useState<Filters>({
    roundNumber: "",
    tokenRange: [0, 1000000],
    purchaseLimit: [0, 1000],
    dateRange: {
      start: null,
      end: null,
    },
  });
  const [maxTokens, setMaxTokens] = useState(1000000);
  const [maxPurchaseLimit, setMaxPurchaseLimit] = useState(1000);
  const [rounds, setRounds] = useState<number[]>([]);
  const currentDate = new Date();
  const [selectedFtoId, setSelectedFtoId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchFTOs();
  }, []);

  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

  useEffect(() => {
    if (ftos.length > 0) {
      const maxTokensValue = Math.max(...ftos.map((fto) => fto.tokensForSale));
      const maxPurchaseLimitValue = Math.max(
        ...ftos.map((fto) => fto.purchaseLimit)
      );
      const uniqueRounds = [
        ...new Set(ftos.map((fto) => fto.roundNumber)),
      ].sort((a, b) => a - b);

      setMaxTokens(maxTokensValue);
      setMaxPurchaseLimit(maxPurchaseLimitValue);
      setRounds(uniqueRounds);
      setFilters((prev) => ({
        ...prev,
        tokenRange: [0, maxTokensValue],
        purchaseLimit: [0, maxPurchaseLimitValue],
      }));
    }
  }, [ftos]);

  const fetchFTOs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Ftos")
        .select(
          `
          *,
          Atheletes (
            firstName,
            lastName,
            fanTokenSymbol,
            profilePicture
          )
        `
        )
        .order("startDate", { ascending: true });
      if (error) throw error;
      setFtos(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching FTOs"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    setPage(0);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this FTO?")) {
      try {
        const { error } = await supabase.from("Ftos").delete().eq("id", id);

        if (error) throw error;
        setFtos(ftos.filter((fto) => fto.id !== id));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while deleting the FTO"
        );
      }
    }
  };

  const handleEdit = (ftoId: string) => {
    setSelectedFtoId(ftoId);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedFtoId(null);
  };

  const filterFTOs = (ftoList: FTO[]) => {
    return ftoList.filter((fto) => {
      const matchesSearch =
        fto.Atheletes.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        fto.Atheletes.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        fto.Atheletes.tokenSymbol
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesRound =
        !filters.roundNumber || fto.roundNumber === filters.roundNumber;
      const matchesTokenRange =
        fto.tokensForSale >= filters.tokenRange[0] &&
        fto.tokensForSale <= filters.tokenRange[1];
      const matchesPurchaseLimit =
        fto.purchaseLimit >= filters.purchaseLimit[0] &&
        fto.purchaseLimit <= filters.purchaseLimit[1];

      let matchesDateRange = true;
      if (filters.dateRange.start) {
        matchesDateRange =
          matchesDateRange &&
          new Date(fto.startDate) >= new Date(filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        matchesDateRange =
          matchesDateRange &&
          new Date(fto.endDate) <= new Date(filters.dateRange.end);
      }

      return (
        matchesSearch &&
        matchesRound &&
        matchesTokenRange &&
        matchesPurchaseLimit &&
        matchesDateRange
      );
    });
  };

  const handleFilterChange = (filterName: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPage(0);
  };

  const renderFilters = () => (
    <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>Round</InputLabel>
        <Select
          value={filters.roundNumber}
          onChange={(e) => handleFilterChange("roundNumber", e.target.value)}
          label="Round"
        >
          <MenuItem value="">All Rounds</MenuItem>
          {rounds.map((round) => (
            <MenuItem key={round} value={round}>
              Round {round}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ width: 250 }}>
        <Typography gutterBottom>Tokens for Sale</Typography>
        <Slider
          value={filters.tokenRange}
          onChange={(_, value) => handleFilterChange("tokenRange", value)}
          valueLabelDisplay="auto"
          min={0}
          max={maxTokens}
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {filters.tokenRange[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filters.tokenRange[1]}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: 250 }}>
        <Typography gutterBottom>Purchase Limit</Typography>
        <Slider
          value={filters.purchaseLimit}
          onChange={(_, value) => handleFilterChange("purchaseLimit", value)}
          valueLabelDisplay="auto"
          min={0}
          max={maxPurchaseLimit}
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {filters.purchaseLimit[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filters.purchaseLimit[1]}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <TextField
          label="Start Date"
          type="date"
          value={filters.dateRange.start || ""}
          onChange={(e) =>
            handleFilterChange("dateRange", {
              ...filters.dateRange,
              start: e.target.value,
            })
          }
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={filters.dateRange.end || ""}
          onChange={(e) =>
            handleFilterChange("dateRange", {
              ...filters.dateRange,
              end: e.target.value,
            })
          }
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Box>
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedFTOs = (ftoList: FTO[]) => {
    return filterFTOs(ftoList).slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  };

  const renderFTOGrid = (ftoList: FTO[], showEdit: boolean = true) => (
    <Grid container spacing={2}>
      {paginatedFTOs(ftoList).map((fto) => (
        <Grid item xs={12} sm={6} md={4} key={fto.id}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              transition:
                "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 4,
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                paddingTop: "56.25%", // 16:9 aspect ratio
                backgroundColor: "grey.100",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
            >
              <Box
                component="img"
                src={fto.coverImageUrl || "/placeholder.png"}
                alt="FTO Cover"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                  component="img"
                  src={fto.Atheletes.profilePicture || "/placeholder.png"}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    mr: 2,
                    border: 2,
                    borderColor: "primary.main",
                  }}
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {fto.Atheletes.firstName} {fto.Atheletes.lastName}
                  </Typography>
                  <Typography color="text.secondary" variant="subtitle2">
                    {fto.Atheletes.tokenSymbol}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip
                  label={`Round ${fto.roundNumber}`}
                  color="primary"
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
                <Chip
                  label={`${fto.tokensForSale} Tokens`}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                />
                <Chip
                  label={`Limit: ${fto.purchaseLimit}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                />
                {fto.active && (
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    sx={{ borderRadius: 1 }}
                  />
                )}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Start: {format(new Date(fto.startDate), "PPp")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  End: {format(new Date(fto.endDate), "PPp")}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: "auto",
                }}
              >
                {showEdit ? (
                  <>
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => handleEdit(fto.id)}
                        size="small"
                        sx={{
                          color: "primary.main",
                          "&:hover": { bgcolor: "primary.lighter" },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDelete(fto.id)}
                        size="small"
                        sx={{
                          color: "error.main",
                          "&:hover": { bgcolor: "error.lighter" },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip title="View Details">
                    <IconButton
                      component={Link}
                      to={`/ftos/view/${fto.id}`}
                      size="small"
                      sx={{
                        color: "primary.main",
                        "&:hover": { bgcolor: "primary.lighter" },
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderFTOTable = (ftoList: FTO[], showEdit: boolean = true) => (
    <Box
      sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden" }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Athlete</TableCell>
              <TableCell>Round</TableCell>
              <TableCell align="right">Tokens for Sale</TableCell>
              <TableCell align="right">Purchase Limit</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFTOs(ftoList).map((fto) => (
              <TableRow
                key={fto.id}
                sx={{
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      component="img"
                      src={fto.Atheletes.profilePicture || "/placeholder.png"}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        mr: 2,
                        border: 1,
                        borderColor: "primary.main",
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {fto.Atheletes.firstName} {fto.Atheletes.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {fto.Atheletes.tokenSymbol}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`Round ${fto.roundNumber}`}
                    size="small"
                    color="primary"
                    sx={{ borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell align="right">{fto.tokensForSale}</TableCell>
                <TableCell align="right">{fto.purchaseLimit}</TableCell>
                <TableCell>{format(new Date(fto.startDate), "PPp")}</TableCell>
                <TableCell>{format(new Date(fto.endDate), "PPp")}</TableCell>
                <TableCell>
                  {fto.active ? (
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  ) : (
                    <Chip
                      label="Inactive"
                      color="default"
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {showEdit ? (
                    <>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEdit(fto.id)}
                          size="small"
                          sx={{
                            mr: 1,
                            color: "primary.main",
                            "&:hover": { bgcolor: "primary.lighter" },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(fto.id)}
                          size="small"
                          sx={{
                            color: "error.main",
                            "&:hover": { bgcolor: "error.lighter" },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip title="View Details">
                      <IconButton
                        component={Link}
                        to={`/ftos/view/${fto.id}`}
                        size="small"
                        sx={{
                          color: "primary.main",
                          "&:hover": { bgcolor: "primary.lighter" },
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filterFTOs(ftoList).length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={isMobile ? [5, 10] : [10, 25, 50]}
      />
    </Box>
  );

  const getFutureFTOs = () => {
    return ftos.filter((fto) => new Date(fto.startDate) >= currentDate);
  };

  const getPastFTOs = () => {
    return ftos.filter((fto) => new Date(fto.endDate) < currentDate);
  };
  const getCurrentFTOs = () => {
    return ftos.filter((fto) => new Date(fto.startDate) < currentDate && new Date(fto.endDate) > currentDate);
  };
  

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: "background.default",
        borderRadius: 2,
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Fan Token Offerings (FTOs)
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              variant={viewMode === "grid" ? "contained" : "outlined"}
              onClick={() => setViewMode("grid")}
              startIcon={<GridViewIcon />}
              fullWidth={isMobile}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "contained" : "outlined"}
              onClick={() => setViewMode("table")}
              startIcon={<ViewListIcon />}
              fullWidth={isMobile}
            >
              Table
            </Button>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/ftos/create"
              fullWidth={isMobile}
            >
              Create New FTO
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          margin="normal"
          placeholder="Search FTOs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mt: 3,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "background.paper",
              borderRadius: 2,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        {renderFilters()}
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={value}
          onChange={handleTabChange}
          sx={{
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              minWidth: 100,
            },
          }}
        >
          <Tab label="Past FTOs" />
          <Tab label="Current FTOs" />
          <Tab label="Future FTOs" />

        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {viewMode === "grid"
          ? renderFTOGrid(filterFTOs(getPastFTOs()), true)
          : renderFTOTable(filterFTOs(getPastFTOs()), true)}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {viewMode === "grid"
          ? renderFTOGrid(filterFTOs(getCurrentFTOs()))
          : renderFTOTable(filterFTOs(getCurrentFTOs()))}
      </TabPanel>
      <TabPanel value={value} index={2}>
        {viewMode === "grid"
          ? renderFTOGrid(filterFTOs(getFutureFTOs()))
          : renderFTOTable(filterFTOs(getFutureFTOs()))}
      </TabPanel>
   
      {selectedFtoId && (
        <EditFTO
          open={editModalOpen}
          onClose={handleEditClose}
          ftoId={selectedFtoId}
          onUpdate={fetchFTOs}
        />
      )}
    </Paper>
  );
}
