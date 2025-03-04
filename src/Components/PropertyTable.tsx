import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, TablePagination, TextField,
  Button, TableSortLabel, FormControl, Select, MenuItem,
  Card, CardContent, CardActions, Typography, IconButton, Chip
} from '@mui/material';

// Icons
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Data interface for your property items
 */
interface PropertyData {
  site: string;
  images: string[];
  main_image?: string;
  linkText?: string;
  linkHref?: string;
  linkTitle?: string;
  link?: string;
  location_map?: string;
  info_beds?: string;
  info_bath?: string;
  info_habitable?: string;
  info_land?: string;
  description?: string;
  location_details?: string;
  ref?: string;
  location?: string;
  price?: string;
}

type Order = 'asc' | 'desc';
type ViewMode = 'table' | 'card';

// The columns to show in table view:
const tableColumns: (keyof PropertyData)[] = [
  'site',
  'linkText',
  'location',
  'price',
  'info_beds',
  'info_bath',
  'ref',
  'description',
  'images',
  'link',
];

/** 
 * Strips "Save" at the start and "French Property Currency" at the end 
 * of linkText, if present.
 */
function cleanLinkText(text: string): string {
  let result = text.trim();

  if (result.startsWith('Save')) {
    result = result.slice(4).trim();
  }
  const endPhrase = 'French Property Currency';
  if (result.endsWith(endPhrase)) {
    result = result.slice(0, -endPhrase.length).trim();
  }

  return result;
}

/** 
 * Removes non-digits from a string like "€300,000" or "120 m2" 
 * and returns an integer. Returns 0 if none found.
 */
function parseNumberFromString(str?: string): number {
  if (!str) return 0;
  const numericStr = str.replace(/[^\d]/g, '');
  if (!numericStr) return 0;
  return parseInt(numericStr, 10);
}

const PropertyTable: React.FC = () => {
  // Master property list from the server
  const [properties, setProperties] = useState<PropertyData[]>([]);
  // Filtered & sorted subset
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>([]);

  // Basic text search, site filter
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');

  // Sorting
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof PropertyData>('site');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Toggle table vs card
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Current image index for each property card
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});

  // Numeric filters
  const [bedsFilter, setBedsFilter] = useState<number | null>(null);     
  const [bathsFilter, setBathsFilter] = useState<number | null>(null);  
  const [minHabitable, setMinHabitable] = useState<number | null>(null);
  const [minLand, setMinLand] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  // Fetch on mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Just to see the data in console
  useEffect(() => {
    console.log('properties', properties);
  }, [properties]);

  /**
   * Fetch from your Node /api/scrape
   */
  const fetchProperties = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/scrape');
      const data = await response.json();
      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setFilteredProperties([]);
    }
  };

  /**
   * Reset everything and refetch
   */
  const handleUpdate = async () => {
    setSearchQuery('');
    setSiteFilter('');
    setOrder('asc');
    setOrderBy('linkText');
    setPage(0);

    // Reset numeric filters
    setBedsFilter(null);
    setBathsFilter(null);
    setMinHabitable(null);
    setMinLand(null);
    setMaxPrice(null);

    await fetchProperties();
  };

  /**
   * Filter & sort properties whenever dependencies change
   */
  useEffect(() => {
    let temp = [...properties];

    // Site filter
    if (siteFilter) {
      temp = temp.filter((p) => p.site === siteFilter);
    }

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      temp = temp.filter((p) => {
        const combined = [
          p.site,
          p.linkText,
          p.linkTitle,
          p.location,
          p.description,
          p.price,
          p.ref,
        ]
          .filter(Boolean)
          .map((str) => str!.toLowerCase())
          .join(' ');
        return combined.includes(query);
      });
    }

    // Numeric filters
    temp = temp.filter((p) => {
      const numericBeds = parseNumberFromString(p.info_beds);
      const numericBaths = parseNumberFromString(p.info_bath);
      const numericHabitable = parseNumberFromString(p.info_habitable);
      const numericLand = parseNumberFromString(p.info_land);
      const numericPrice = parseNumberFromString(p.price);

      // Beds
      if (bedsFilter !== null) {
        if (bedsFilter === 7) {
          if (numericBeds < 7) return false;
        } else {
          if (numericBeds !== bedsFilter) return false;
        }
      }
      // Baths
      if (bathsFilter !== null) {
        if (bathsFilter === 7) {
          if (numericBaths < 7) return false;
        } else {
          if (numericBaths !== bathsFilter) return false;
        }
      }
      // Min habitable
      if (minHabitable !== null) {
        if (numericHabitable < minHabitable) return false;
      }
      // Min land
      if (minLand !== null) {
        if (numericLand < minLand) return false;
      }
      // Max price
      if (maxPrice !== null) {
        if (numericPrice > maxPrice) return false;
      }
      return true;
    });

    // Sort
    temp.sort((a, b) => {
      let valA = a[orderBy] || '';
      let valB = b[orderBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProperties(temp);
  }, [
    properties, siteFilter, searchQuery,
    bedsFilter, bathsFilter, minHabitable, minLand, maxPrice,
    order, orderBy
  ]);

  /**
   * Sorting in table columns
   */
  const handleSort = (columnId: keyof PropertyData) => {
    if (orderBy === columnId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(columnId);
      setOrder('asc');
    }
  };

  /**
   * Pagination
   */
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const paginatedProperties = filteredProperties.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  /**
   * Switch table/card mode
   */
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'table' ? 'card' : 'table'));
  };

  /**
   * Move to next/prev image for card view
   */
  const handleNextImage = (propIndex: number) => {
    setCurrentImageIndex((prev) => {
      const currentIdx = prev[propIndex] ?? 0;
      const images = paginatedProperties[propIndex].images;
      if (!images || images.length === 0) return prev;
      const nextIdx = (currentIdx + 1) % images.length;
      return { ...prev, [propIndex]: nextIdx };
    });
  };
  const handlePrevImage = (propIndex: number) => {
    setCurrentImageIndex((prev) => {
      const currentIdx = prev[propIndex] ?? 0;
      const images = paginatedProperties[propIndex].images;
      if (!images || images.length === 0) return prev;
      const prevIdx = currentIdx === 0 ? images.length - 1 : currentIdx - 1;
      return { ...prev, [propIndex]: prevIdx };
    });
  };

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Real Estate Listings</h1>

      {/* Top row: Update + Toggle */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={handleUpdate}>
          Update Listings
        </Button>
        <Button variant="outlined" onClick={toggleViewMode}>
          Switch to {viewMode === 'table' ? 'Card' : 'Table'} View
        </Button>
      </div>

      {/*
        Search + Filters 
        Instead of MUI labels, we put <div> labels above each field.
        We rely on 'placeholder' for the user to see how to use it.
      */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}>Search</div>
          <TextField
            placeholder="Search..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: 200 }}
          />
        </div>

        {/* Site Filter */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}>Site</div>
          <FormControl variant="outlined" size="small" style={{ minWidth: 160 }} >
            <Select
              displayEmpty
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value as string)}
            >
              <MenuItem value="">All Sites</MenuItem>
              <MenuItem value="French-Property.com">French-Property.com</MenuItem>
              {/* More site options if needed */}
            </Select>
          </FormControl>
        </div>

        {/* # of Beds */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}># of Beds</div>
          <FormControl variant="outlined" size="small" style={{ minWidth: 100 }}>
            <Select
              displayEmpty
              value={bedsFilter?.toString() || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) setBedsFilter(null);
                else setBedsFilter(parseInt(val, 10));
              }}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="0">0</MenuItem>
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
              <MenuItem value="3">3</MenuItem>
              <MenuItem value="4">4</MenuItem>
              <MenuItem value="5">5</MenuItem>
              <MenuItem value="6">6</MenuItem>
              <MenuItem value="7">7+</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* # of Baths */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}># of Baths</div>
          <FormControl variant="outlined" size="small" style={{ minWidth: 100 }}>
            <Select
              displayEmpty
              value={bathsFilter?.toString() || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) setBathsFilter(null);
                else setBathsFilter(parseInt(val, 10));
              }}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="0">0</MenuItem>
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
              <MenuItem value="3">3</MenuItem>
              <MenuItem value="4">4</MenuItem>
              <MenuItem value="5">5</MenuItem>
              <MenuItem value="6">6</MenuItem>
              <MenuItem value="7">7+</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Min Habitable (m2) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}>Min m²</div>
          <TextField
            placeholder="e.g. 100"
            variant="outlined"
            size="small"
            type="number"
            value={minHabitable?.toString() || ''}
            onChange={(e) => {
              const val = e.target.value;
              setMinHabitable(val ? parseInt(val, 10) : null);
            }}
            style={{ maxWidth: 100 }}
          />
        </div>

        {/* Min Land (m2) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}>Min Land m²</div>
          <TextField
            placeholder="e.g. 500"
            variant="outlined"
            size="small"
            type="number"
            value={minLand?.toString() || ''}
            onChange={(e) => {
              const val = e.target.value;
              setMinLand(val ? parseInt(val, 10) : null);
            }}
            style={{ maxWidth: 120 }}
          />
        </div>

        {/* Max Price */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold' }}>Max Price (€)</div>
          <TextField
            placeholder="e.g. 300000"
            variant="outlined"
            size="small"
            type="number"
            value={maxPrice?.toString() || ''}
            onChange={(e) => {
              const val = e.target.value;
              setMaxPrice(val ? parseInt(val, 10) : null);
            }}
            style={{ maxWidth: 120 }}
          />
        </div>
      </div>

      {/* ACTIVE FILTER CHIPS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {bedsFilter !== null && (
          <Chip
            label={`Beds: ${bedsFilter === 7 ? '7+' : bedsFilter}`}
            onDelete={() => setBedsFilter(null)}
            deleteIcon={<CloseIcon />}
          />
        )}
        {bathsFilter !== null && (
          <Chip
            label={`Baths: ${bathsFilter === 7 ? '7+' : bathsFilter}`}
            onDelete={() => setBathsFilter(null)}
            deleteIcon={<CloseIcon />}
          />
        )}
        {minHabitable !== null && (
          <Chip
            label={`Min m²: ${minHabitable}`}
            onDelete={() => setMinHabitable(null)}
            deleteIcon={<CloseIcon />}
          />
        )}
        {minLand !== null && (
          <Chip
            label={`Min Land: ${minLand} m²`}
            onDelete={() => setMinLand(null)}
            deleteIcon={<CloseIcon />}
          />
        )}
        {maxPrice !== null && (
          <Chip
            label={`Max €: ${maxPrice}`}
            onDelete={() => setMaxPrice(null)}
            deleteIcon={<CloseIcon />}
          />
        )}
      </div>

      {/* If no properties match */}
      {filteredProperties.length === 0 ? (
        <div style={{ margin: '1rem 0' }}>
          <h3>No properties available.</h3>
          <p>Please update the listings or refine your filters.</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {tableColumns.map((col) => (
                      <TableCell key={col}>
                        <TableSortLabel
                          active={orderBy === col}
                          direction={orderBy === col ? order : 'asc'}
                          onClick={() => handleSort(col)}
                        >
                          {col.toUpperCase()}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProperties.map((prop, idx) => (
                    <TableRow key={idx}>
                      {tableColumns.map((col) => {
                        let cellValue: React.ReactNode = prop[col] || '';

                        if (col === 'linkText') {
                          const originalText = prop.linkText || '';
                          const cleanedText = cleanLinkText(originalText);
                          cellValue = cleanedText || 'N/A';
                        } else if (col === 'link') {
                          cellValue = prop.link ? (
                            <a
                              href={prop.link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'blue' }}
                            >
                              View Listing
                            </a>
                          ) : (
                            'N/A'
                          );
                        } else if (col === 'images') {
                          if (prop.images && prop.images.length > 0) {
                            cellValue = `${prop.images.length} images`;
                          } else {
                            cellValue = 'No images';
                          }
                        }

                        return <TableCell key={col}>{cellValue}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {viewMode === 'card' && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              {paginatedProperties.map((prop, idx) => {
                // array of images for this card
                const images = prop.images || [];
                // which index is currently shown
                const currentIdx = currentImageIndex[idx] ?? 0;
                // the URL of the currently displayed image
                const currentImageUrl = images[currentIdx] || '';
                // clean the linkText
                const cleanedText = cleanLinkText(prop.linkText || '');

                return (
                  <Card
                    key={idx}
                    sx={{
                      // Single column on mobile (xs: '100%'), 
                      // 30% width on md and up
                      width: { xs: '100%', md: '30%' },
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Single image + arrows */}
                    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                      {images.length > 0 ? (
                        <img
                          src={currentImageUrl}
                          alt="Property"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            backgroundColor: '#f0f0f0',
                          }}
                        >
                          No Images
                        </div>
                      )}
                      {images.length > 1 && (
                        <IconButton
                          onClick={() => handlePrevImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '8px',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          }}
                          size="small"
                        >
                          <ArrowBackIosNewIcon fontSize="small" />
                        </IconButton>
                      )}
                      {images.length > 1 && (
                        <IconButton
                          onClick={() => handleNextImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '8px',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          }}
                          size="small"
                        >
                          <ArrowForwardIosIcon fontSize="small" />
                        </IconButton>
                      )}
                    </div>

                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {cleanedText || prop.ref || 'Property'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {prop.location}
                      </Typography>
                      {prop.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {prop.description}
                        </Typography>
                      )}
                      {prop.price && (
                        <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                          <strong>{prop.price}</strong>
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      {prop.link && (
                        <Button
                          size="small"
                          color="primary"
                          href={prop.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Listing
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredProperties.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </div>
  );
};

export default PropertyTable;
