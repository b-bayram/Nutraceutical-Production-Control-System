import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';


const FilterPanel = ({ filters, onChange, onApply, onReset }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Product Name Filter */}
        <div>
          <Label>Product Name</Label>
          <Input
            value={filters.name}
            onChange={(e) => onChange({ ...filters, name: e.target.value })}
            placeholder="Search by name..."
          />
        </div>

        {/* Recipe Status Filter */}
        <div>
          <Label>Recipe Status</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={filters.hasRecipe}
            onChange={(e) => onChange({ ...filters, hasRecipe: e.target.value })}
            >
            <option value="all">All Products</option>
            <option value="true">Has Recipe</option>
            <option value="false">No Recipe</option>
            </select>
        </div>

        {/* Date Range Filters */}
        <div>
          <Label>Created After</Label>
          <Input
            type="date"
            value={filters.createdAfter}
            onChange={(e) => onChange({ ...filters, createdAfter: e.target.value })}
          />
        </div>

        <div>
          <Label>Created Before</Label>
          <Input
            type="date"
            value={filters.createdBefore}
            onChange={(e) => onChange({ ...filters, createdBefore: e.target.value })}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onReset}
        >
          Reset Filters
        </Button>
        <Button
          onClick={onApply}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;