import { useState } from "react";

const AMENITY_OPTIONS = [
  "AC", "Parking", "Catering", "Generator", "Sound System", "Decoration", "Swimming", "Garden",
];

const SearchFilter = ({ onFilter, loading }) => {
  const [filters, setFilters] = useState({
    city:        "",
    minPrice:    "",
    maxPrice:    "",
    minCapacity: "",
    amenities:   [],
  });
  const [open, setOpen] = useState(false); // mobile toggle

  const handleChange = (e) =>
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggleAmenity = (a) =>
    setFilters((p) => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter((x) => x !== a)
        : [...p.amenities, a],
    }));

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (filters.city)        params.city        = filters.city;
    if (filters.minPrice)    params.minPrice    = filters.minPrice;
    if (filters.maxPrice)    params.maxPrice    = filters.maxPrice;
    if (filters.minCapacity) params.minCapacity = filters.minCapacity;
    if (filters.amenities.length) params.amenities = filters.amenities.join(",");
    onFilter(params);
  };

  const handleReset = () => {
    setFilters({ city: "", minPrice: "", maxPrice: "", minCapacity: "", amenities: [] });
    onFilter({});
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-5 mb-8">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex justify-between items-center md:hidden mb-2 text-sm font-semibold text-primary"
      >
        <span>🔍 Search & Filter</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      <form
        onSubmit={handleSearch}
        className={`${open ? "block" : "hidden"} md:block`}
      >
        {/* Row 1: city + price range + capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              City
            </label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder="e.g. Pune, Mumbai"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Min Price (₹/day)
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleChange}
              placeholder="e.g. 20000"
              className="input-field text-sm"
              min={0}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Max Price (₹/day)
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleChange}
              placeholder="e.g. 100000"
              className="input-field text-sm"
              min={0}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Min Capacity
            </label>
            <input
              type="number"
              name="minCapacity"
              value={filters.minCapacity}
              onChange={handleChange}
              placeholder="e.g. 200"
              className="input-field text-sm"
              min={0}
            />
          </div>
        </div>

        {/* Row 2: amenities */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Amenities
          </label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => {
              const active = filters.amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8"
          >
            {loading ? "Searching..." : "🔍 Search"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-outline px-6"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchFilter;