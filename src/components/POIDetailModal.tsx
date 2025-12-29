/**
 * POI Detail Modal
 * Displays detailed information about a POI with booking options
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Navigation,
  Star,
  Clock,
  Phone,
  ExternalLink,
  Heart,
  Plus,
  DollarSign,
  Wifi,
  ParkingCircle,
  Utensils,
  Info,
} from 'lucide-react';
import type { POI } from '@/types';

interface POIDetailModalProps {
  poi: POI | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddToRoute?: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  restaurant: Utensils,
  'gas-station': ParkingCircle,
  parking: ParkingCircle,
  attraction: MapPin,
  shopping: MapPin,
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: 'text-orange-600 bg-orange-100',
  'gas-station': 'text-blue-600 bg-blue-100',
  parking: 'text-indigo-600 bg-indigo-100',
  attraction: 'text-pink-600 bg-pink-100',
  shopping: 'text-green-600 bg-green-100',
};

export function POIDetailModal({
  poi,
  open,
  onOpenChange,
  isFavorite = false,
  onToggleFavorite,
  onAddToRoute,
}: POIDetailModalProps) {
  if (!poi) return null;

  const IconComponent = CATEGORY_ICONS[poi.type] || MapPin;
  const colorClass = CATEGORY_COLORS[poi.type] || 'text-gray-600 bg-gray-100';

  const formatDistance = (distance?: number) => {
    if (!distance) return '';

    // Convert km to miles
    const miles = distance * 0.621371;

    if (distance < 1) {
      // Less than 1km - show in meters and feet
      const meters = Math.round(distance * 1000);
      const feet = Math.round(meters * 3.28084);
      return `${meters}m (${feet}ft) away`;
    }

    // 1km or more - show in km and miles
    return `${distance.toFixed(1)}km (${miles.toFixed(1)}mi) away`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${colorClass} shrink-0`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{poi.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {poi.address || 'Location details'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {poi.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{poi.rating.toFixed(1)}</span>
                {poi.reviews && (
                  <span className="text-sm text-muted-foreground">
                    ({poi.reviews} reviews)
                  </span>
                )}
              </div>
            )}

            {poi.distance && (
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-sm">{formatDistance(poi.distance)}</span>
              </div>
            )}

            {poi.hours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{poi.hours}</span>
              </div>
            )}

            {poi.pricePerHour && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  ${poi.pricePerHour.toFixed(2)}/hour
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Amenities */}
          {poi.amenities && poi.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {poi.amenities.map((amenity, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Parking-specific info */}
          {poi.type === 'parking' && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {poi.availability !== undefined && poi.totalSpaces && (
                  <div>
                    <p className="text-sm font-medium mb-1">Availability</p>
                    <p className="text-2xl font-bold text-green-600">
                      {poi.availability}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {poi.totalSpaces} spaces
                    </p>
                  </div>
                )}

                {poi.maxStayHours && (
                  <div>
                    <p className="text-sm font-medium mb-1">Max Stay</p>
                    <p className="text-2xl font-bold">
                      {poi.maxStayHours}
                      <span className="text-sm font-normal"> hrs</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Payment methods */}
          {poi.paymentMethods && poi.paymentMethods.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Payment Methods</h3>
                <div className="flex flex-wrap gap-2">
                  {poi.paymentMethods.map((method, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Phone */}
          {poi.phone && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{poi.phone}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${poi.phone}`)}
                >
                  Call
                </Button>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            {onToggleFavorite && (
              <Button
                variant={isFavorite ? 'default' : 'outline'}
                onClick={onToggleFavorite}
                className="flex-1"
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`}
                />
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
            )}

            {onAddToRoute && (
              <Button variant="outline" onClick={onAddToRoute} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add to Route
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${poi.location.lat},${poi.location.lng}`;
                window.open(url, '_blank');
              }}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Directions
            </Button>
          </div>

          {/* Future: Booking Section */}
          {poi.type === 'parking' && (
            <>
              <Separator />
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Reserve Parking</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Booking functionality coming soon! Reserve your spot in advance.
                </p>
                <Button variant="secondary" size="sm" disabled>
                  Reserve Now (Coming Soon)
                </Button>
              </div>
            </>
          )}

          {poi.type === 'restaurant' && (
            <>
              <Separator />
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Make a Reservation</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Table booking integration coming soon!
                </p>
                <Button variant="secondary" size="sm" disabled>
                  Book Table (Coming Soon)
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
