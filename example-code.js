// Fallback example code
window.fallbackExampleCode = `import torch
import torch.nn.functional as F
import random
import numpy as np
from torch_geometric.nn import GCNConv
from torch_geometric.loader import DataLoader
from torchmetrics.functional import mean_squared_error
from lrim_loader import LRIM

# Simple GCN baseline model for node-level regression
class SimpleGCN(torch.nn.Module):
    def __init__(self, hidden_dim=64):
        super().__init__()
        self.conv1 = GCNConv(1, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, hidden_dim)
        self.lin = torch.nn.Linear(hidden_dim, 1)

    def forward(self, data):
        x, edge_index = data.x, data.edge_index
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        x = F.relu(x)

        # Node-level prediction (no pooling)
        x = self.lin(x)

        return x

# Simple MLP for node-level regression (no graph structure)
class SimpleMLP(torch.nn.Module):
    def __init__(self, hidden_dim=64):
        super().__init__()
        self.lin1 = torch.nn.Linear(1, hidden_dim)
        self.lin2 = torch.nn.Linear(hidden_dim, hidden_dim)
        self.lin3 = torch.nn.Linear(hidden_dim, 1)

    def forward(self, data):
        x = data.x

        x = self.lin1(x)
        x = F.relu(x)
        x = self.lin2(x)
        x = F.relu(x)
        x = self.lin3(x)

        return x

def train(model, loader, optimizer, device):
    model.train()
    total_mse = 0
    total_nodes = 0

    for data in loader:
        data = data.to(device)
        optimizer.zero_grad()
        out = model(data)
        loss = F.mse_loss(out, data.y)
        loss.backward()
        optimizer.step()
        total_mse += loss.item() * data.num_nodes
        total_nodes += data.num_nodes

    mse = total_mse / total_nodes
    return torch.log10(torch.tensor(mse)).item()

def evaluate(model, loader, device):
    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for data in loader:
            data = data.to(device)
            out = model(data)
            all_preds.append(out)
            all_targets.append(data.y)

    # Concatenate all predictions and targets
    all_preds = torch.cat(all_preds, dim=0)
    all_targets = torch.cat(all_targets, dim=0)

    # Compute MSE on all data at once
    mse = mean_squared_error(all_preds, all_targets)
    return torch.log10(mse).item()

def train_and_evaluate_model(model_class, model_name, train_loader, val_loader, test_loader,
                               hidden_dim, lr, epochs, device):
    """Train and evaluate a model, returning the test loss."""
    print("\\n" + "="*50)
    print(f"Training {model_name}")
    print("="*50)

    model = model_class(hidden_dim=hidden_dim).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    print(f"Model parameters: {sum(p.numel() for p in model.parameters())}")
    print(f"Starting training for {epochs} epochs...\\n")

    best_val_loss = float('inf')
    save_path = f'best_model_{model_name.lower().replace(" ", "_")}.pt'

    for epoch in range(1, epochs + 1):
        train_loss = train(model, train_loader, optimizer, device)
        val_loss = evaluate(model, val_loader, device)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), save_path)

        print(f"Epoch {epoch:02d}: Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")

    # Load best model and evaluate on test set
    model.load_state_dict(torch.load(save_path))
    test_loss = evaluate(model, test_loader, device)
    print(f"\\n{model_name} Test Loss: {test_loss:.4f}")

    return test_loss

def main():
    # Configuration
    seed = 42
    dataset_name = 'lrim_16_0.6_10k'
    batch_size = 32
    hidden_dim = 64
    lr = 0.001
    epochs = 10
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Set all random seeds for reproducibility
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

    print(f"Training on: {device}")
    print(f"Seed: {seed}")
    print(f"Dataset: {dataset_name}")

    # Load dataset
    dataset = LRIM(root='data/', name=dataset_name)
    splits = dataset.get_idx_split()

    print(f"Total samples: {len(dataset)}")
    print(f"Train: {len(splits['train'])}, Val: {len(splits['val'])}, Test: {len(splits['test'])}")

    # Create data loaders
    train_loader = DataLoader(dataset[splits['train']], batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(dataset[splits['val']], batch_size=batch_size)
    test_loader = DataLoader(dataset[splits['test']], batch_size=batch_size)

    # Train both models
    test_loss_gcn = train_and_evaluate_model(
        SimpleGCN, "SimpleGCN", train_loader, val_loader, test_loader,
        hidden_dim, lr, epochs, device
    )

    test_loss_mlp = train_and_evaluate_model(
        SimpleMLP, "SimpleMLP", train_loader, val_loader, test_loader,
        hidden_dim, lr, epochs, device
    )

    # Summary
    print("\\n" + "="*50)
    print("Final Results Summary")
    print("="*50)
    print(f"SimpleGCN Test Loss: {test_loss_gcn:.4f}")
    print(f"SimpleMLP Test Loss: {test_loss_mlp:.4f}")

if __name__ == '__main__':
    main()`;
