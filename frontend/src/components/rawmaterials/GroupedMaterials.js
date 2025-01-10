import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const GroupedMaterials = ({ materials, onEdit, onAddBatch, onDeleteType }) => {
  // State for pagination and expansion
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedTypes, setExpandedTypes] = useState(new Set());
  const typesPerPage = 10;
  
  // Get array of material types for pagination
  const totalPages = Math.ceil(materials.length / typesPerPage);
  
  // Get current page's material types
  const indexOfLastType = currentPage * typesPerPage;
  const indexOfFirstType = indexOfLastType - typesPerPage;
  const currentTypes = materials.slice(indexOfFirstType, indexOfLastType);

  const toggleTypeExpansion = (typeName) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeName)) {
      newExpanded.delete(typeName);
    } else {
      newExpanded.add(typeName);
    }
    setExpandedTypes(newExpanded);
  };

  // Handle collapse/expand all
  const toggleAllTypes = () => {
    if (expandedTypes.size === currentTypes.length) {
      // If all are expanded, collapse all
      setExpandedTypes(new Set());
    } else {
      // If some or none are expanded, expand all
      setExpandedTypes(new Set(currentTypes.map((material) => material.materialName)));
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setExpandedTypes(new Set()); // Collapse all when changing pages
  };

  const getPageNumbers = () => {
    let pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }
    return pages;
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleAllTypes}
          className="text-blue-600 hover:text-blue-800 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50"
        >
          {expandedTypes.size === currentTypes.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow mb-4">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left w-2/5">Material Type</th>
              <th className="px-6 py-3 text-left w-1/5">Total Batches</th>
              <th className="px-6 py-3 text-left w-1/5">Total Amount</th>
              <th className="px-6 py-3 text-left w-1/5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTypes.map((material) => (
              <React.Fragment key={material.materialName}>
                {/* Material Type Row */}
                <tr className={`hover:bg-gray-50 border-b ${material.batches.length === 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4 w-2/5">
                    <button 
                      onClick={() => toggleTypeExpansion(material.materialName)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <div className={`chevron-icon ${expandedTypes.has(material.materialName) ? 'expanded' : ''}`}>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      </div>
                      <span className={`truncate ${material.batches.length === 0 ? 'italic' : ''}`}>
                        {material.materialName}
                      </span>
                    </button>
                  </td>
                  <td className={`px-6 py-4 w-1/5 ${material.batches.length === 0 ? 'text-red-600 font-medium' : ''}`}>
                    {material.batches.length}
                  </td>
                  <td className={`px-6 py-4 w-1/5 ${material.batches.length === 0 ? 'text-red-600 font-medium' : ''}`}>
                    {material.batches.reduce((sum, batch) => sum + batch.remainingAmount, 0)}
                  </td>
                  <td className="px-6 py-4 w-1/5">
                    <button 
                      onClick={() => onAddBatch(material.materialName)}
                      className={`whitespace-nowrap ${
                        material.batches.length === 0 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      Add Batch
                    </button>
                  </td>
                </tr>
                
                {/* Expanded Batches */}
                <tr>
                  <td colSpan="4" className="p-0">
                    <div className={`batch-content ${expandedTypes.has(material.materialName) ? 'expanded' : ''}`}>
                      <div className="px-6 py-4 bg-gray-50">
                        <table className="w-full">
                          <thead>
                            <tr className="text-sm text-gray-600">
                              <th className="px-4 py-2 text-left">Batch ID</th>
                              <th className="px-4 py-2 text-left">Remaining Amount</th>
                              <th className="px-4 py-2 text-left">Supplier</th>
                              <th className="px-4 py-2 text-left">Expiration Date</th>
                              <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {material.batches.length > 0 ? (
                              material.batches.map((batch) => (
                                <tr key={batch.id} className="hover:bg-gray-100">
                                  <td className="px-4 py-2">{batch.serialNumber}</td>
                                  <td className="px-4 py-2">{batch.remainingAmount}</td>
                                  <td className="px-4 py-2">{batch.supplierName}</td>
                                  <td className="px-4 py-2">
                                    {new Date(batch.expirationDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2">
                                    <button 
                                      onClick={() => onEdit(batch.id)}
                                      className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <>
                                <tr>
                                  <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                                    No batches available
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="5" className="px-4 pb-4 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      <p className="text-sm text-gray-500 mb-2">
                                        Warning: Material types used in recipes cannot be deleted even if they have no batches
                                      </p>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete ${material.materialName}? This cannot be undone.`)) {
                                            onDeleteType(material.typeId);
                                          }
                                        }}
                                        className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                                      >
                                        Delete Material Type
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm text-gray-700">
            Showing {indexOfFirstType + 1} - {Math.min(indexOfLastType, materials.length)} of {materials.length} material types
          </p>
        </div>
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 
                    ${currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
};

export default GroupedMaterials;