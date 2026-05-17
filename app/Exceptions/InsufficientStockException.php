<?php

namespace App\Exceptions;

use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public function __construct(string $ingredientName, string $warehouseName, float $available, float $requested)
    {
        parent::__construct(
            "Insufficient stock for \"{$ingredientName}\" in {$warehouseName}. ".
            "Available: {$available}, Requested: {$requested}."
        );
    }
}
