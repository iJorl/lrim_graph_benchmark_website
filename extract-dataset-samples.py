#!/usr/bin/env python3
"""
Extract dataset samples from .pt files and convert to JavaScript format
for web visualization. Focus on .x and .y values from PyG data objects.
"""

import torch
import json
from pathlib import Path
import argparse

def extract_samples_from_dataset(dataset_path, num_samples=10, verbose=True):
    """Extract first num_samples from a PyG dataset file, focusing on .x and .y values."""
    try:
        # Load PyTorch data file (weights_only=False to allow PyG Data objects)
        data = torch.load(dataset_path, map_location='cpu', weights_only=False)

        samples = []
        if verbose:
            print(f"  Dataset type: {type(data)}, Length: {len(data)}")

        for i in range(min(num_samples, len(data))):
            sample = data[i]

            # Extract just .x and .y values with compact keys
            sample_data = {
                'i': i,  # index
                'x': None,  # Node features/spin states
                'y': None,  # Target values
            }

            # Extract .x (node features - likely spin states)
            if hasattr(sample, 'x') and sample.x is not None:
                x_list = sample.x.tolist()
                # Flatten if each element is a single-item list like [[1], [-1], ...]
                if x_list and isinstance(x_list[0], list) and len(x_list[0]) == 1:
                    sample_data['x'] = [item[0] for item in x_list]
                else:
                    sample_data['x'] = x_list
                if verbose:
                    print(f"    Sample {i}: x shape {sample.x.shape}")

            # Extract .y (target values)
            if hasattr(sample, 'y') and sample.y is not None:
                if sample.y.numel() == 1:
                    sample_data['y'] = sample.y.item()
                else:
                    y_list = sample.y.tolist()
                    # Flatten if each element is a single-item list
                    if y_list and isinstance(y_list[0], list) and len(y_list[0]) == 1:
                        sample_data['y'] = [item[0] for item in y_list]
                    else:
                        sample_data['y'] = y_list
                if verbose:
                    print(f"    Sample {i}: y shape {sample.y.shape if hasattr(sample.y, 'shape') else 'scalar'}")

            samples.append(sample_data)

        return samples

    except Exception as e:
        print(f"Error processing {dataset_path}: {e}")
        return []

def main():
    """Main function to process dataset files."""
    parser = argparse.ArgumentParser(description='Extract dataset samples to JavaScript')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output (default: False)')
    parser.add_argument('--compact', action='store_true', default=True, help='Generate compact JS output (default: True)')
    parser.add_argument('--samples', type=int, default=10, help='Number of samples per dataset (default: 10)')
    args = parser.parse_args()

    # Define paths
    data_dir = Path("../data/raw")

    # Find all dataset .pt files ending in _10k
    dataset_files = []
    for f in data_dir.glob("*_10k.pt"):
        # Extract size from filename (format: lrim_SIZE_sigma_10k.pt)
        parts = f.stem.split("_")
        if len(parts) >= 2 and parts[0] == "lrim":
            try:
                size = int(parts[1])
                if size <= 256:  # Include sizes up to 256
                    dataset_files.append(f)
            except ValueError:
                continue

    print(f"Found {len(dataset_files)} dataset files")

    all_datasets = {}

    if dataset_files:
        for dataset_file in dataset_files:
            if args.verbose:
                print(f"Processing dataset: {dataset_file.name}...")

            samples = extract_samples_from_dataset(dataset_file, num_samples=args.samples, verbose=args.verbose)
            if samples:
                if args.verbose:
                    print(f"Extracted {len(samples)} samples from {dataset_file.name}")

                # Extract dataset info from filename
                # Format: lrim_128_0.6_10k.pt
                parts = dataset_file.stem.split("_")
                if len(parts) >= 4 and parts[0] == "lrim":
                    dataset_key = f"lrim_{parts[1]}_{parts[2]}_{parts[3]}"

                    # Use compact keys
                    all_datasets[dataset_key] = {
                        's': parts[1],  # size
                        'g': parts[2],  # sigma
                        'd': samples    # data samples
                    }
                else:
                    if args.verbose:
                        print(f"Could not parse filename format: {dataset_file.name}")
            else:
                if args.verbose:
                    print(f"No samples found in {dataset_file.name}")

        # Generate JavaScript file with all datasets
        if all_datasets:
            if args.compact:
                # Compact output: no indentation, no comments
                js_content = f"const datasetSamples={json.dumps(all_datasets, separators=(',', ':'))};if(typeof module!=='undefined'&&module.exports){{module.exports={{datasetSamples}};}}else if(typeof window!=='undefined'){{window.datasetSamples=datasetSamples;}}"
            else:
                # Human-readable output with formatting
                js_content = f"""const datasetSamples = {json.dumps(all_datasets, indent=2)};

if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ datasetSamples }};
}} else if (typeof window !== 'undefined') {{
    window.datasetSamples = datasetSamples;
}}
"""

            # Write JavaScript file
            output_file = Path("lrim_dataset.js")
            output_file.write_text(js_content)

            print(f"Generated {output_file} with {len(all_datasets)} datasets")
            print(f"File size: {output_file.stat().st_size / 1024:.1f} KB")

            if args.verbose:
                # Print summary
                print("\nDataset summary:")
                for key, dataset in all_datasets.items():
                    print(f"  {key}: {len(dataset['d'])} samples, grid size {dataset['s']}x{dataset['s']}")
        else:
            print("No datasets were processed successfully")
    else:
        print("No dataset files found")

if __name__ == "__main__":
    main()